using Backapi.Data;
using Backapi.Models;
using Backapi.DTOs;
using Backapi.Services; // Ensure you have this namespace
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;

namespace Backapi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PatientsController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IAuthService _authService; // ✅ Inject Security Service

        public PatientsController(AppDbContext db, IAuthService authService)
        {
            _db = db;
            _authService = authService;
        }

        // ✅ 1. Get All Patients
        [HttpGet]
        public async Task<IActionResult> GetAll() => Ok(await _db.Patients.ToListAsync());

        // ✅ 2. Get Patient by ID
        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var p = await _db.Patients.FindAsync(id);
            if (p == null) return NotFound();
            return Ok(p);
        }

        // ✅ 3. NEW: Get Patient by Email (For Dashboard Profile Loading)
        [HttpGet("by-email/{email}")]
        public async Task<IActionResult> GetByEmail(string email)
        {
            var p = await _db.Patients.FirstOrDefaultAsync(x => x.Email == email);
            if (p == null) return NotFound(new { message = "Patient not found" });
            return Ok(p);
        }

        // ✅ 4. REGISTER (Sign Up with Email & Password)
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] PatientRegisterDto dto)
        {
            // 1. Validation: Check if Email exists
            if (await _db.Patients.AnyAsync(x => x.Email == dto.Email))
            {
                return BadRequest(new { message = "Email already registered" });
            }

            // 2. Hash Password & Create Patient
            var patient = new Patient
            {
                Name = dto.Name,
                Age = dto.Age,
                PhoneNumber = dto.PhoneNumber,
                Gender = dto.Gender,
                BloodGroup = dto.BloodGroup,

                Email = dto.Email,
                // Hashing logic from your existing service
                PasswordHash = _authService.HashPassword(dto.Password)
            };

            _db.Patients.Add(patient);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Registration Successful", patientId = patient.PatientId });
        }

        // ✅ 5. LOGIN (Authenticate User)
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] PatientLoginDto dto)
        {
            // 1. Find User by Email
            var patient = await _db.Patients.FirstOrDefaultAsync(x => x.Email == dto.Email);

            if (patient == null)
                return Unauthorized(new { message = "User not registered" });

            // 2. Verify Password using Hash
            if (!_authService.VerifyPassword(dto.Password, patient.PasswordHash))
                return Unauthorized(new { message = "Invalid Email or Password" });

            // 3. Login Success
            return Ok(new
            {
                message = "Login Successful",
                user = new
                {
                    Name = patient.Name,
                    Email = patient.Email,
                    Phone = patient.PhoneNumber
                }
            });
        }

        // ✅ 6. Update Profile
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] PatientRegisterDto dto)
        {
            var p = await _db.Patients.FindAsync(id);
            if (p == null) return NotFound();

            p.Name = dto.Name;
            p.Age = dto.Age;
            p.Gender = dto.Gender;
            p.BloodGroup = dto.BloodGroup;
            p.PhoneNumber = dto.PhoneNumber;

            // Note: We are ignoring password updates here to keep it simple for now

            await _db.SaveChangesAsync();
            return Ok(p);
        }

        // ✅ 7. Delete Patient
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var p = await _db.Patients.FindAsync(id);
            if (p == null) return NotFound();
            _db.Patients.Remove(p);
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}