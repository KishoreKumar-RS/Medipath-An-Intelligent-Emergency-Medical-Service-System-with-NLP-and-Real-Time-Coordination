using System.ComponentModel.DataAnnotations;

namespace Backapi.DTOs
{
    public class FacilityDto
    {
        public int FacilityId { get; set; }
        [Required] public string FacilityName { get; set; }
        [Required] public bool Availability { get; set; }
    }
}
