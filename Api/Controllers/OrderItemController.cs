using Api.Data;
using Api.Models;

namespace Api.Controllers
{
    public class OrderItemController : BaseODataController<OrderItem, ApplicationDbContext>
    {
        public OrderItemController(ApplicationDbContext context) : base(context)
        {
        }
    }
}
