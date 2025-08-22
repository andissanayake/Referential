using Api.Data;
using Api.Models;

namespace Api.Controllers
{
    public class CustomerController : BaseODataController<Customer, ApplicationDbContext>
    {
        public CustomerController(ApplicationDbContext context) : base(context)
        {
        }
    }
}
