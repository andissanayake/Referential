using Api.Data;
using Api.Models;
using Microsoft.AspNetCore.OData;
using Microsoft.AspNetCore.OData.Routing.Conventions;
using Microsoft.EntityFrameworkCore;
using Microsoft.OData.Edm;
using Microsoft.OData.ModelBuilder;

namespace Api
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add CORS to allow any origin
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowAnyOrigin", policy =>
                {
                    policy.AllowAnyOrigin()
                          .AllowAnyMethod()
                          .AllowAnyHeader();
                });
            });

            // Add services to the container.
            builder.Services.AddControllers()
                .AddOData((options, sp) =>
                {
                    options
                    .Select()
                    .Filter()
                    .OrderBy()
                    .SetMaxTop(100)
                    .Count()
                    .Expand()
                    .AddRouteComponents("odata", GetEdmModel());

                    // Turn off routing conventions that generate routes from controller actions
                    options.Conventions.Clear();

                    // Only keep the cool ones: /odata/$metadata and routes from attributes
                    options.Conventions.Add(ActivatorUtilities.CreateInstance<MetadataRoutingConvention>(sp));
                    options.Conventions.Add(ActivatorUtilities.CreateInstance<AttributeRoutingConvention>(sp));
                });

            // Register the EDM model as a singleton service so it can be injected
            builder.Services.AddSingleton<IEdmModel>(GetEdmModel());

            // Add Entity Framework Core
            builder.Services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

            // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            var app = builder.Build();

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseHttpsRedirection();
            
            // Use CORS middleware
            app.UseCors("AllowAnyOrigin");
            
            app.UseAuthorization();
            app.MapControllers();

            // Ensure database is created and seeded
            using (var scope = app.Services.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

                // Drop and recreate database to ensure all tables are created
                context.Database.EnsureDeleted();
                context.Database.EnsureCreated();
            }

            app.Run();
        }

        private static IEdmModel GetEdmModel()
        {
            var builder = new ODataConventionModelBuilder();
            builder.EntitySet<Product>("Products");
            builder.EntitySet<Category>("Categories");
            builder.EntitySet<Customer>("Customers");
            builder.EntitySet<Order>("Orders");
            builder.EntitySet<OrderItem>("OrderItems");
            return builder.GetEdmModel();
        }
    }
}
