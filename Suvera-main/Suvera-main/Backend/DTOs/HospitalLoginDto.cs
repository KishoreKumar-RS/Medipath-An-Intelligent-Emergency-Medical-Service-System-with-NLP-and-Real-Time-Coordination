using System.ComponentModel.DataAnnotations;

namespace Backapi.DTOs
{
    public class HospitalLoginDto
    {
        [Required][EmailAddress] public string Email { get; set; }
        [Required] public string Password { get; set; }
    }
}
