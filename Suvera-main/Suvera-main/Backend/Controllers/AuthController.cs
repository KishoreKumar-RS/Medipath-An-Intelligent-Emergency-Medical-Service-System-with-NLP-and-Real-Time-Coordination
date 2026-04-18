using Backapi.Data;
using Backapi.DTOs;
using Backapi.Models;
using Backapi.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;
using System;

namespace Backapi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IAuthService _authService;

        public AuthController(AppDbContext db, IAuthService authService)
        {
            _db = db;
            _authService = authService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] HospitalRegisterDto dto)
        {
            if (await _db.Hospitals.AnyAsync(h => h.Email == dto.Email))
                return BadRequest(new { message = "Email already registered" });

            var hospital = new Hospital
            {
                Name = dto.Name,
                Address = dto.Address,
                PhoneNumber = dto.PhoneNumber,
                LicenceNumber = dto.LicenceNumber,
                Email = dto.Email,
                PasswordHash = _authService.HashPassword(dto.Password),

                // ✅ FIX: Use Capital 'L' here to match the C# Class Property
                // EF Core will save this into your lowercase 'latitude' SQL column.
                Latitude = dto.Latitude,
                Longitude = dto.Longitude,

                CreatedAt = DateTime.UtcNow
            };

            _db.Hospitals.Add(hospital);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Registered successfully" });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] HospitalLoginDto dto)
        {
            var hospital = await _db.Hospitals.FirstOrDefaultAsync(h => h.Email == dto.Email);

            if (hospital == null)
                return Unauthorized(new { message = "Invalid credentials" });

            if (!_authService.VerifyPassword(dto.Password, hospital.PasswordHash))
                return Unauthorized(new { message = "Invalid credentials" });

            var token = _authService.GenerateJwtToken(hospital);

            return Ok(new { token });
        }
    }
}
