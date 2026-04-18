using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backapi.Models
{
    public class Doctor
    {
        [Key]
        public int DoctorId { get; set; }

        [Required]
        [ForeignKey(nameof(Hospital))]
        public int HospitalId { get; set; }
        public Hospital Hospital { get; set; }

        [Required] public string Name { get; set; }
        [Required] public string Specialization { get; set; }
        [Required] public string LicenceNumber { get; set; }
        [Required] public string PhoneNumber { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
