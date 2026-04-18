using Backapi.Data;
using Backapi.Models;
using Backapi.Repositories;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Backapi.Repositories
{
    public class HospitalRepository : IHospitalRepository
    {
        private readonly AppDbContext _db;

        public HospitalRepository(AppDbContext db)
        {
            _db = db;
        }

        // --- BASIC CRUD ---

        public async Task AddAsync(Hospital hospital)
        {
            await _db.Hospitals.AddAsync(hospital);
            await _db.SaveChangesAsync();
        }

        public async Task<Hospital> GetByEmailAsync(string email)
            => await _db.Hospitals.FirstOrDefaultAsync(h => h.Email == email);

       
        public async Task<Hospital> GetByIdAsync(int id)
            // Changed to match your Model's Primary Key 'HospitalId'
            => await _db.Hospitals.FirstOrDefaultAsync(h => h.HospitalId == id);


        // --- THE AI INTEGRATION SEARCH ---

        public async Task<IEnumerable<Hospital>> GetHospitalsBySpecialtyAsync(string specialty)
        {
            // 1. Prepare the query including Children tables
            // We use .Include to fetch the data so we can filter it.
            var query = _db.Hospitals
                .Include(h => h.Facilities) 
                .Include(h => h.Doctors)    
                .AsQueryable();

            // 2. Handle "General" or empty cases (return everything)
            if (string.IsNullOrEmpty(specialty) || specialty == "General" || specialty == "Normal")
            {
                return await query.ToListAsync();
            }

            // 3. The Filtering Logic
            // The AI gives us text like "Cardiology".
            // We check: 
            // - Does any Facility have "Cardiology" in its Name? (FacilityName)
            // - OR Does any Doctor have "Cardiologist" in their Specialization? (Specialization)
            
            query = query.Where(h => 
                h.Facilities.Any(f => f.FacilityName.Contains(specialty)) || 
                h.Doctors.Any(d => d.Specialization.Contains(specialty))
            );

            return await query.ToListAsync();


        }
    }
}