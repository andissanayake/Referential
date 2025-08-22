using Api.Data;
using Api.Models;

namespace Api.Controllers
{
    public class OrderController : BaseODataController<Order, ApplicationDbContext>
    {
        public OrderController(ApplicationDbContext context) : base(context)
        {
        }
    }
}
