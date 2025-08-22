using System.ComponentModel.DataAnnotations;
using System.ComponentModel;

namespace Api.Models
{
    public class Category
    {
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        [Display(Name = "Category Name", Description = "Enter the name of the category")]
        public string Name { get; set; } = string.Empty;

        [StringLength(500)]
        [Display(Name = "Description", Description = "Provide a description of the category")]
        [DataType(DataType.MultilineText)]
        public string? Description { get; set; }

        [Display(Name = "Active", Description = "Indicates if the category is active")]
        public bool IsActive { get; set; } = true;

        public DateTime? CreatedDate { get; set; }

        public DateTime? ModifiedDate { get; set; }

        // Navigation properties
        public virtual ICollection<Product> Products { get; set; } = [];
    }
}
