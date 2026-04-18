using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backapi.Models
{
    public class Facility
    {
        [Key]
        public int FacilityId { get; set; }

        [Required]
        [ForeignKey(nameof(Hospital))]
        public int HospitalId { get; set; }
        public Hospital Hospital { get; set; }

        [Required] public string FacilityName { get; set; }
        [Required] public bool Availability { get; set; } = true;
    }
}
