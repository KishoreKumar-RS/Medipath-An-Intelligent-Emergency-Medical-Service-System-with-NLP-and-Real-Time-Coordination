using Backapi.Data;
using Backapi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;

namespace Backapi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RequestsController : ControllerBase
    {
        private readonly AppDbContext _db;

        public RequestsController(AppDbContext db)
        {
            _db = db;
        }

        // 1. USER SENDS REQUEST
        [HttpPost("create")]
        public async Task<IActionResult> CreateRequest([FromBody] EmergencyRequest req)
        {
            req.Status = "Pending";
            req.RequestTime = System.DateTime.UtcNow;
            _db.EmergencyRequests.Add(req);
            await _db.SaveChangesAsync();
            return Ok(new { id = req.RequestId, message = "Alert Sent to Hospital" });
        }

        // 2. HOSPITAL SEES REQUESTS (Polling)
        [HttpGet("hospital/{hospitalId}")]
        public async Task<IActionResult> GetHospitalRequests(int hospitalId)
        {
            var requests = await _db.EmergencyRequests
                                    .Where(r => r.HospitalId == hospitalId && r.Status == "Pending")
                                    .OrderByDescending(r => r.RequestTime)
                                    .ToListAsync();
            return Ok(requests);
        }

        // 3. HOSPITAL UPDATES STATUS (Accept/Decline)
        [HttpPost("update-status/{requestId}")]
        public async Task<IActionResult> UpdateStatus(int requestId, [FromBody] string newStatus)
        {
            var req = await _db.EmergencyRequests.FindAsync(requestId);
            if (req == null) return NotFound();

            req.Status = newStatus; // "Accepted" or "Declined"
            await _db.SaveChangesAsync();
            return Ok(new { message = "Status Updated" });
        }

        // 4. USER CHECKS STATUS (Polling)
        [HttpGet("check-status/{requestId}")]
        public async Task<IActionResult> CheckStatus(int requestId)
        {
            var req = await _db.EmergencyRequests.FindAsync(requestId);
            if (req == null) return NotFound();
            return Ok(new { status = req.Status });
        }
    }
}