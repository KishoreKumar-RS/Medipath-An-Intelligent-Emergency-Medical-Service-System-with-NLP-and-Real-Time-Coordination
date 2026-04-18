using Backapi.Data;
using Backapi.DTOs;
using Backapi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Linq; // Added for string manipulation

namespace Backapi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DoctorsController : ControllerBase
    {
        private readonly AppDbContext _db;
        public DoctorsController(AppDbContext db) => _db = db;

        private int GetHospitalIdFromClaim()
        {
            var claim = User.FindFirst("hospitalId")?.Value;
            if (claim == null) return 0; // Safety check
            return int.Parse(claim);
        }

        [HttpGet]
        public async Task<IActionResult> GetMyDoctors()
        {
            var hid = GetHospitalIdFromClaim();

            var doctors = await _db.Doctors
                .Include(d => d.Hospital)
                .Where(d => d.HospitalId == hid)
                .ToListAsync();

            return Ok(doctors);
        }

        [HttpPost]
        public async Task<IActionResult> CreateDoctor([FromBody] DoctorDto dto)
        {
            var hid = GetHospitalIdFromClaim();

            // 1. Standard Doctor Creation Logic
            var doctor = new Doctor
            {
                HospitalId = hid,
                Name = dto.Name,
                Specialization = dto.Specialization,
                LicenceNumber = dto.LicenceNumber,
                PhoneNumber = dto.PhoneNumber
            };

            _db.Doctors.Add(doctor);

            // 2. NEW FEATURE: Auto-create Facility based on Specialization
            if (!string.IsNullOrWhiteSpace(dto.Specialization))
            {
                var cleanSpec = dto.Specialization.Trim();

                // Check if this facility already exists for this hospital (Case insensitive check)
                var existingFacility = await _db.Facilities
                    .FirstOrDefaultAsync(f => f.HospitalId == hid && f.FacilityName.ToLower() == cleanSpec.ToLower());

                if (existingFacility == null)
                {
                    // Facility doesn't exist, create it
                    var newFacility = new Facility
                    {
                        HospitalId = hid,
                        FacilityName = cleanSpec, // Use the proper casing from input
                        Availability = true       // Logic: If we just hired a doctor for this, it's available
                    };
                    _db.Facilities.Add(newFacility);
                }
                else
                {
                    // Optional: If the facility exists but was marked Unavailable (false), 
                    // we should probably set it to True since we just added a doctor.
                    if (existingFacility.Availability == false)
                    {
                        existingFacility.Availability = true;
                    }
                }
            }

            // 3. Save both Doctor and Facility changes in one transaction
            await _db.SaveChangesAsync();

            return Ok(doctor);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDoctor(int id, [FromBody] DoctorDto dto)
        {
            var hid = GetHospitalIdFromClaim();
            var doctor = await _db.Doctors.FirstOrDefaultAsync(d => d.DoctorId == id && d.HospitalId == hid);
            if (doctor == null) return NotFound();

            // Note: If you change specialization here, you might want to add logic 
            // to add the NEW specialization to facilities as well, 
            // but for now, we keep original features strictly as requested.

            doctor.Name = dto.Name;
            doctor.Specialization = dto.Specialization;
            doctor.LicenceNumber = dto.LicenceNumber;
            doctor.PhoneNumber = dto.PhoneNumber;

            await _db.SaveChangesAsync();
            return Ok(doctor);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDoctor(int id)
        {
            var hid = GetHospitalIdFromClaim();
            var doctor = await _db.Doctors.FirstOrDefaultAsync(d => d.DoctorId == id && d.HospitalId == hid);
            if (doctor == null) return NotFound();
            _db.Doctors.Remove(doctor);
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}