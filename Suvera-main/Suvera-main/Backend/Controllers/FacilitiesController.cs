using Backapi.Data;
using Backapi.DTOs;
using Backapi.Models;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;

namespace Backapi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class FacilitiesController : ControllerBase
    {
        private readonly AppDbContext _db;
        public FacilitiesController(AppDbContext db) => _db = db;

        private int GetHospitalIdFromClaim() => int.Parse(User.FindFirst("hospitalId").Value);

        [HttpGet]
        public async Task<IActionResult> GetMyFacilities()
        {
            var hid = GetHospitalIdFromClaim();
            var items = await _db.Facilities.Where(f => f.HospitalId == hid).ToListAsync();
            return Ok(items);
        }

        [HttpPost]
        public async Task<IActionResult> CreateFacility([FromBody] FacilityDto dto)
        {
            var hid = GetHospitalIdFromClaim();
            var f = new Facility
            {
                HospitalId = hid,
                FacilityName = dto.FacilityName,
                Availability = dto.Availability
            };
            _db.Facilities.Add(f);
            await _db.SaveChangesAsync();
            return Ok(f);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateFacility(int id, [FromBody] FacilityDto dto)
        {
            var hid = GetHospitalIdFromClaim();
            var f = await _db.Facilities.FirstOrDefaultAsync(x => x.FacilityId == id && x.HospitalId == hid);
            if (f == null) return NotFound();

            f.FacilityName = dto.FacilityName;
            f.Availability = dto.Availability;
            await _db.SaveChangesAsync();
            return Ok(f);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteFacility(int id)
        {
            var hid = GetHospitalIdFromClaim();
            var f = await _db.Facilities.FirstOrDefaultAsync(x => x.FacilityId == id && x.HospitalId == hid);
            if (f == null) return NotFound();

            _db.Facilities.Remove(f);
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}
