using Api.Data;
using Api.Models;

namespace Api.Controllers
{
    public class ProductController(ApplicationDbContext context) : BaseODataController<Product, ApplicationDbContext>(context)
    {
    }
}
