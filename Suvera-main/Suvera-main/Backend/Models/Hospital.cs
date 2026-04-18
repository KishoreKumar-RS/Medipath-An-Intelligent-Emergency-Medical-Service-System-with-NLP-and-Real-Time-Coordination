using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema; // Needed for specific SQL types if used

namespace Backapi.Models
{
    public class Hospital
    {
        [Key]
        public int HospitalId { get; set; } // Matches SQL
        [Required] public string Name { get; set; }
        [Required] public string Address { get; set; }
        [Required] public string PhoneNumber { get; set; }
        [Required] public string LicenceNumber { get; set; }
        [Required][EmailAddress] public string Email { get; set; }
        [Required] public string PasswordHash { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Inside Backapi/Models/Hospital.cs
        // It maps to SQL column 'latitude' automatically
        [Column(TypeName = "decimal(18, 10)")] // Helper to ensure it matches SQL
        public decimal Latitude { get; set; }

        [Column(TypeName = "decimal(18, 10)")]
        public decimal Longitude { get; set; }

       

        // --- MAP COORDINATES (Needed for React Map) ---
        // Ensure these columns exist in your SQL 'Hospitals' table!

        // --- NAVIGATION PROPERTIES ---
        public ICollection<Doctor> Doctors { get; set; }
        public ICollection<Facility> Facilities { get; set; }
    }
}
