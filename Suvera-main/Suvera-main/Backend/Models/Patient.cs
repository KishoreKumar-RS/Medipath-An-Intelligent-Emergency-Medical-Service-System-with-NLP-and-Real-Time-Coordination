using System.ComponentModel.DataAnnotations;

namespace Backapi.Models
{
    public class Patient
    {
        [Key]
        public int PatientId { get; set; }
        [Required] public string Name { get; set; }
        [Required] public int Age { get; set; }
        [Required] public string PhoneNumber { get; set; }
        [Required] public string Gender { get; set; }
        [Required] public string BloodGroup { get; set; }

        public string Email { get; set; }
        public string PasswordHash { get; set; }
    }
}
