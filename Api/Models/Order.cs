using System.ComponentModel.DataAnnotations;
using System.ComponentModel;

namespace Api.Models
{
    public class Order
    {
        public int Id { get; set; }
        
        [Required]
        [Display(Name = "Customer", Description = "Select the customer for this order")]
        public int CustomerId { get; set; }
        
        [Required]
        [StringLength(50)]
        [Display(Name = "Order Number", Description = "Enter the order number")]
        public string OrderNumber { get; set; } = string.Empty;
        
        [Display(Name = "Order Date", Description = "Date when the order was placed")]
        [DataType(DataType.Date)]
        public DateTime OrderDate { get; set; } = DateTime.UtcNow;
        
        [Required]
        [StringLength(20)]
        [Display(Name = "Status", Description = "Current status of the order")]
        public string Status { get; set; } = "Pending"; // Pending, Processing, Shipped, Delivered, Cancelled
        
        [Range(0, double.MaxValue)]
        [Display(Name = "Total Amount", Description = "Total amount of the order")]
        [DataType(DataType.Currency)]
        public decimal TotalAmount { get; set; }
        
        [StringLength(500)]
        [Display(Name = "Notes", Description = "Additional notes for the order")]
        [DataType(DataType.MultilineText)]
        public string? Notes { get; set; }
        
        public DateTime? CreatedDate { get; set; }
        
        public DateTime? ModifiedDate { get; set; }
        
        // Navigation properties
        public virtual Customer Customer { get; set; } = null!;
        public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    }
}
