using System.ComponentModel.DataAnnotations;
using System.ComponentModel;

namespace Api.Models
{
    public class Customer
    {
        public int Id { get; set; }
        
        [Required]
        [StringLength(100)]
        [Display(Name = "First Name", Description = "Enter the customer's first name")]
        public string FirstName { get; set; } = string.Empty;
        
        [Required]
        [StringLength(100)]
        [Display(Name = "Last Name", Description = "Enter the customer's last name")]
        public string LastName { get; set; } = string.Empty;
        
        [Required]
        [EmailAddress]
        [StringLength(255)]
        [Display(Name = "Email Address", Description = "Enter the customer's email address")]
        public string Email { get; set; } = string.Empty;
        
        [StringLength(20)]
        [Display(Name = "Phone Number", Description = "Enter the customer's phone number")]
        [DataType(DataType.PhoneNumber)]
        public string? Phone { get; set; }
        
        [StringLength(500)]
        [Display(Name = "Address", Description = "Enter the customer's address")]
        [DataType(DataType.MultilineText)]
        public string? Address { get; set; }
        
        [Display(Name = "Active", Description = "Indicates if the customer is active")]
        public bool IsActive { get; set; } = true;
        
        public DateTime? CreatedDate { get; set; }
        
        public DateTime? ModifiedDate { get; set; }
        
        // Navigation properties
        public virtual ICollection<Order> Orders { get; set; } = new List<Order>();
    }
}
