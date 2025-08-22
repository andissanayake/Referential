using Api.Data;
using Api.Models;

namespace Api.Controllers
{
    public class CategoryController(ApplicationDbContext context) : BaseODataController<Category, ApplicationDbContext>(context)
    {
    }
}
