using System.ComponentModel.DataAnnotations;

namespace Backapi.DTOs
{
    public class HospitalRegisterDto
    {
        [Required] public string Name { get; set; }
        [Required] public string Address { get; set; }
        [Required] public string PhoneNumber { get; set; }
        [Required] public string LicenceNumber { get; set; }
        [Required][EmailAddress] public string Email { get; set; }
        [Required][MinLength(6)] public string Password { get; set; }
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
    }
}
