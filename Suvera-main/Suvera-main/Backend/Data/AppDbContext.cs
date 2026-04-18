using Backapi.Models;
using Microsoft.EntityFrameworkCore;

namespace Backapi.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Hospital> Hospitals { get; set; }
        public DbSet<Doctor> Doctors { get; set; }
        public DbSet<Facility> Facilities { get; set; }
        public DbSet<Patient> Patients { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Unique Email for Hospital
            modelBuilder.Entity<Hospital>()
                .HasIndex(h => h.Email)
                .IsUnique();

            // Doctor -> Hospital relationship
            modelBuilder.Entity<Doctor>()
                .HasOne(d => d.Hospital)
                .WithMany(h => h.Doctors)
                .HasForeignKey(d => d.HospitalId)
                .OnDelete(DeleteBehavior.Cascade);

            // Facility -> Hospital relationship
            modelBuilder.Entity<Facility>()
                .HasOne(f => f.Hospital)
                .WithMany(h => h.Facilities)
                .HasForeignKey(f => f.HospitalId)
                .OnDelete(DeleteBehavior.Cascade);
        }

        public DbSet<EmergencyRequest> EmergencyRequests { get; set; }
    }
}
