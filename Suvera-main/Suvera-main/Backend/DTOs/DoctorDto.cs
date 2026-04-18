using System.ComponentModel.DataAnnotations;

namespace Backapi.DTOs
{
    public class DoctorDto
    {
        public int DoctorId { get; set; }
        [Required] public string Name { get; set; }
        [Required] public string Specialization { get; set; }
        [Required] public string LicenceNumber { get; set; }
        [Required] public string PhoneNumber { get; set; }
    }
}
