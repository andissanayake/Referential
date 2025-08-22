using System.ComponentModel.DataAnnotations;
using System.ComponentModel;

namespace Api.Models
{
    public class OrderItem
    {
        public int Id { get; set; }
        
        [Required]
        [Display(Name = "Order", Description = "Select the order for this item")]
        public int OrderId { get; set; }
        
        [Required]
        [Display(Name = "Product", Description = "Select the product for this order item")]
        public int ProductId { get; set; }
        
        [Required]
        [Range(1, int.MaxValue)]
        [Display(Name = "Quantity", Description = "Number of items ordered")]
        public int Quantity { get; set; }
        
        [Required]
        [Range(0, double.MaxValue)]
        [Display(Name = "Unit Price", Description = "Price per unit")]
        [DataType(DataType.Currency)]
        public decimal UnitPrice { get; set; }
        
        [Range(0, double.MaxValue)]
        [Display(Name = "Discount", Description = "Discount amount applied")]
        [DataType(DataType.Currency)]
        public decimal Discount { get; set; }
        
        [Range(0, double.MaxValue)]
        [Display(Name = "Total Price", Description = "Total price for this item (after discount)")]
        [DataType(DataType.Currency)]
        public decimal TotalPrice { get; set; }
        
        public DateTime? CreatedDate { get; set; }
        
        public DateTime? ModifiedDate { get; set; }
        
        // Navigation properties
        public virtual Order Order { get; set; } = null!;
        public virtual Product Product { get; set; } = null!;
    }
}
