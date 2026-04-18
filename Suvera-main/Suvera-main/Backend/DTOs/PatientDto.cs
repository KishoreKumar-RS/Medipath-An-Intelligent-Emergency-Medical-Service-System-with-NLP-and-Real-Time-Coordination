using System.ComponentModel.DataAnnotations;

namespace Backapi.DTOs
{
    public class PatientRegisterDto
    {
        public int PatientId { get; set; }
        [Required] public string Name { get; set; }
        [Required] public int Age { get; set; }
        [Required] public string PhoneNumber { get; set; }
        [Required] public string Gender { get; set; }
        [Required] public string BloodGroup { get; set; }
        public string Email { get; set; }     // ✅ New
        public string Password { get; set; }
    }

    public class PatientLoginDto
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }
}
