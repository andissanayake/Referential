using Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Api.Data
{
    public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
    {
        public DbSet<Product> Products { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Customer> Customers { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure Product entity
            modelBuilder.Entity<Product>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Description).HasMaxLength(500);
                entity.Property(e => e.Price).HasColumnType("decimal(18,2)");
                entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETUTCDATE()");

                // Relationship with Category
                entity.HasOne(e => e.Category)
                      .WithMany(e => e.Products)
                      .HasForeignKey(e => e.CategoryId)
                      .OnDelete(DeleteBehavior.SetNull);
            });

            // Configure Category entity
            modelBuilder.Entity<Category>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Description).HasMaxLength(500);
                entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETUTCDATE()");
            });

            // Configure Customer entity
            modelBuilder.Entity<Customer>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.FirstName).IsRequired().HasMaxLength(100);
                entity.Property(e => e.LastName).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
                entity.Property(e => e.Phone).HasMaxLength(20);
                entity.Property(e => e.Address).HasMaxLength(500);
                entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETUTCDATE()");

                // Unique email constraint
                entity.HasIndex(e => e.Email).IsUnique();
            });

            // Configure Order entity
            modelBuilder.Entity<Order>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.OrderNumber).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Status).IsRequired().HasMaxLength(20);
                entity.Property(e => e.TotalAmount).HasColumnType("decimal(18,2)");
                entity.Property(e => e.Notes).HasMaxLength(500);
                entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETUTCDATE()");

                // Relationship with Customer
                entity.HasOne(e => e.Customer)
                      .WithMany(e => e.Orders)
                      .HasForeignKey(e => e.CustomerId)
                      .OnDelete(DeleteBehavior.Cascade);

                // Unique order number constraint
                entity.HasIndex(e => e.OrderNumber).IsUnique();
            });

            // Configure OrderItem entity
            modelBuilder.Entity<OrderItem>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.UnitPrice).HasColumnType("decimal(18,2)");
                entity.Property(e => e.Discount).HasColumnType("decimal(18,2)");
                entity.Property(e => e.TotalPrice).HasColumnType("decimal(18,2)");
                entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETUTCDATE()");

                // Relationships
                entity.HasOne(e => e.Order)
                      .WithMany(e => e.OrderItems)
                      .HasForeignKey(e => e.OrderId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Product)
                      .WithMany(e => e.OrderItems)
                      .HasForeignKey(e => e.ProductId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Seed Categories
            modelBuilder.Entity<Category>().HasData(
                new Category { Id = 1, Name = "Electronics", Description = "Electronic devices and gadgets", IsActive = true, CreatedDate = DateTime.UtcNow },
                new Category { Id = 2, Name = "Gaming", Description = "Gaming equipment and accessories", IsActive = true, CreatedDate = DateTime.UtcNow },
                new Category { Id = 3, Name = "Computers", Description = "Computer hardware and components", IsActive = true, CreatedDate = DateTime.UtcNow },
                new Category { Id = 4, Name = "Accessories", Description = "Computer and device accessories", IsActive = true, CreatedDate = DateTime.UtcNow }
            );

            // Seed Products with categories
            modelBuilder.Entity<Product>().HasData(
                new Product { Id = 1, Name = "Gaming Laptop", Description = "High-performance gaming laptop with RTX graphics", Price = 1299.99m, StockQuantity = 50, CategoryId = 1, CreatedDate = DateTime.UtcNow },
                new Product { Id = 2, Name = "Wireless Mouse", Description = "Ergonomic wireless gaming mouse", Price = 79.99m, StockQuantity = 100, CategoryId = 2, CreatedDate = DateTime.UtcNow },
                new Product { Id = 3, Name = "Mechanical Keyboard", Description = "RGB mechanical keyboard with Cherry MX switches", Price = 149.99m, StockQuantity = 75, CategoryId = 2, CreatedDate = DateTime.UtcNow },
                new Product { Id = 4, Name = "4K Monitor", Description = "27-inch 4K gaming monitor with 144Hz refresh rate", Price = 599.99m, StockQuantity = 25, CategoryId = 3, CreatedDate = DateTime.UtcNow },
                new Product { Id = 5, Name = "Gaming Headset", Description = "7.1 surround sound gaming headset with microphone", Price = 89.99m, StockQuantity = 60, CategoryId = 4, CreatedDate = DateTime.UtcNow },
                new Product { Id = 6, Name = "SSD Drive", Description = "1TB NVMe SSD for fast storage", Price = 129.99m, StockQuantity = 80, CategoryId = 3, CreatedDate = DateTime.UtcNow },
                new Product { Id = 7, Name = "Webcam", Description = "1080p HD webcam for streaming", Price = 59.99m, StockQuantity = 45, CategoryId = 4, CreatedDate = DateTime.UtcNow },
                new Product { Id = 8, Name = "Gaming Chair", Description = "Ergonomic gaming chair with lumbar support", Price = 299.99m, StockQuantity = 30, CategoryId = 2, CreatedDate = DateTime.UtcNow }
            );

            // Seed Customers
            modelBuilder.Entity<Customer>().HasData(
                new Customer { Id = 1, FirstName = "John", LastName = "Doe", Email = "john.doe@email.com", Phone = "555-0101", Address = "123 Main St, City, State", IsActive = true, CreatedDate = DateTime.UtcNow },
                new Customer { Id = 2, FirstName = "Jane", LastName = "Smith", Email = "jane.smith@email.com", Phone = "555-0102", Address = "456 Oak Ave, City, State", IsActive = true, CreatedDate = DateTime.UtcNow },
                new Customer { Id = 3, FirstName = "Bob", LastName = "Johnson", Email = "bob.johnson@email.com", Phone = "555-0103", Address = "789 Pine Rd, City, State", IsActive = true, CreatedDate = DateTime.UtcNow },
                new Customer { Id = 4, FirstName = "Alice", LastName = "Brown", Email = "alice.brown@email.com", Phone = "555-0104", Address = "321 Elm St, City, State", IsActive = true, CreatedDate = DateTime.UtcNow },
                new Customer { Id = 5, FirstName = "Charlie", LastName = "Wilson", Email = "charlie.wilson@email.com", Phone = "555-0105", Address = "654 Maple Dr, City, State", IsActive = true, CreatedDate = DateTime.UtcNow }
            );

            // Seed Orders
            modelBuilder.Entity<Order>().HasData(
                new Order { Id = 1, CustomerId = 1, OrderNumber = "ORD-2024-001", OrderDate = DateTime.UtcNow.AddDays(-5), Status = "Delivered", TotalAmount = 1379.98m, CreatedDate = DateTime.UtcNow.AddDays(-5) },
                new Order { Id = 2, CustomerId = 2, OrderNumber = "ORD-2024-002", OrderDate = DateTime.UtcNow.AddDays(-3), Status = "Shipped", TotalAmount = 239.98m, CreatedDate = DateTime.UtcNow.AddDays(-3) },
                new Order { Id = 3, CustomerId = 3, OrderNumber = "ORD-2024-003", OrderDate = DateTime.UtcNow.AddDays(-1), Status = "Processing", TotalAmount = 599.99m, CreatedDate = DateTime.UtcNow.AddDays(-1) },
                new Order { Id = 4, CustomerId = 4, OrderNumber = "ORD-2024-004", OrderDate = DateTime.UtcNow, Status = "Pending", TotalAmount = 449.98m, CreatedDate = DateTime.UtcNow }
            );

            // Seed OrderItems
            modelBuilder.Entity<OrderItem>().HasData(
                new OrderItem { Id = 1, OrderId = 1, ProductId = 1, Quantity = 1, UnitPrice = 1299.99m, Discount = 0, TotalPrice = 1299.99m, CreatedDate = DateTime.UtcNow.AddDays(-5) },
                new OrderItem { Id = 2, OrderId = 1, ProductId = 2, Quantity = 1, UnitPrice = 79.99m, Discount = 0, TotalPrice = 79.99m, CreatedDate = DateTime.UtcNow.AddDays(-5) },
                new OrderItem { Id = 3, OrderId = 2, ProductId = 3, Quantity = 1, UnitPrice = 149.99m, Discount = 0, TotalPrice = 149.99m, CreatedDate = DateTime.UtcNow.AddDays(-3) },
                new OrderItem { Id = 4, OrderId = 2, ProductId = 5, Quantity = 1, UnitPrice = 89.99m, Discount = 0, TotalPrice = 89.99m, CreatedDate = DateTime.UtcNow.AddDays(-3) },
                new OrderItem { Id = 5, OrderId = 3, ProductId = 4, Quantity = 1, UnitPrice = 599.99m, Discount = 0, TotalPrice = 599.99m, CreatedDate = DateTime.UtcNow.AddDays(-1) },
                new OrderItem { Id = 6, OrderId = 4, ProductId = 8, Quantity = 1, UnitPrice = 299.99m, Discount = 0, TotalPrice = 299.99m, CreatedDate = DateTime.UtcNow },
                new OrderItem { Id = 7, OrderId = 4, ProductId = 7, Quantity = 1, UnitPrice = 59.99m, Discount = 0, TotalPrice = 59.99m, CreatedDate = DateTime.UtcNow },
                new OrderItem { Id = 8, OrderId = 4, ProductId = 6, Quantity = 1, UnitPrice = 129.99m, Discount = 0, TotalPrice = 129.99m, CreatedDate = DateTime.UtcNow }
            );
        }
    }
}
