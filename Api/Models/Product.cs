using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using System.ComponentModel;

namespace Api.Models
{
    public class Product
    {
        public int Id { get; set; }
        
        [Required]
        [StringLength(100)]
        [Display(Name = "Product Name", Description = "Enter the name of the product")]
        public string Name { get; set; } = string.Empty;
        
        [StringLength(500)]
        [Display(Name = "Description", Description = "Provide a detailed description of the product")]
        [DataType(DataType.MultilineText)]
        public string? Description { get; set; }
        
        [Range(0, double.MaxValue)]
        [Display(Name = "Price", Description = "Enter the product price in currency")]
        [DataType(DataType.Currency)]
        public decimal Price { get; set; }
        
        [Display(Name = "Stock Quantity", Description = "Current quantity available in stock")]
        [Range(0, int.MaxValue, ErrorMessage = "Stock quantity must be a positive number")]
        public int StockQuantity { get; set; }
        
        [Display(Name = "Category", Description = "Select the product category")]
        public int? CategoryId { get; set; }
        
        [JsonIgnore]
        public DateTime? CreatedDate { get; set; }
        
        [JsonIgnore]
        public DateTime? ModifiedDate { get; set; }
        
        // Navigation properties
        public virtual Category? Category { get; set; }
        public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    }
}
