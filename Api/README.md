# ASP.NET Core API with Entity Framework Core and OData

This project demonstrates how to implement a RESTful API using ASP.NET Core with Entity Framework Core for data access and OData for advanced querying capabilities.

## Features

- **Entity Framework Core**: Relational database context with SQL Server
- **OData Support**: Advanced querying with filtering, sorting, pagination, and expansion
- **CRUD Operations**: Full Create, Read, Update, Delete operations
- **Data Validation**: Model validation with Data Annotations
- **Swagger Documentation**: API documentation with Swagger UI

## Database Setup

The application uses SQL Server LocalDB by default. The connection string is configured in `appsettings.json`:

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=ApiDb;Trusted_Connection=true;MultipleActiveResultSets=true"
}
```

The database will be automatically created when you run the application for the first time.

## API Endpoints

### Products OData Controller

Base URL: `/odata/Products`

#### GET Operations

- **Get all products**: `GET /odata/Products`
- **Get product by ID**: `GET /odata/Products(1)`
- **Filter products**: `GET /odata/Products?$filter=Price gt 500`
- **Sort products**: `GET /odata/Products?$orderby=Name desc`
- **Select specific fields**: `GET /odata/Products?$select=Id,Name,Price`
- **Pagination**: `GET /odata/Products?$top=10&$skip=20`
- **Count**: `GET /odata/Products/$count`

#### POST Operations

- **Create new product**: `POST /odata/Products`
  ```json
  {
    "name": "New Product",
    "description": "Product description",
    "price": 299.99,
    "stockQuantity": 25
  }
  ```

#### PUT Operations

- **Update product**: `PUT /odata/Products(1)`
  ```json
  {
    "id": 1,
    "name": "Updated Product",
    "description": "Updated description",
    "price": 399.99,
    "stockQuantity": 30
  }
  ```

#### PATCH Operations

- **Partial update**: `PATCH /odata/Products(1)`
  ```json
  [
    {
      "op": "replace",
      "path": "/price",
      "value": 449.99
    }
  ]
  ```

#### DELETE Operations

- **Delete product**: `DELETE /odata/Products(1)`

## OData Query Examples

### Filtering
```
GET /odata/Products?$filter=Price gt 500
GET /odata/Products?$filter=contains(Name, 'Laptop')
GET /odata/Products?$filter=StockQuantity gt 50 and Price lt 1000
```

### Sorting
```
GET /odata/Products?$orderby=Price desc
GET /odata/Products?$orderby=Name asc, Price desc
```

### Pagination
```
GET /odata/Products?$top=5&$skip=10
```

### Field Selection
```
GET /odata/Products?$select=Id,Name,Price
```

### Combining Queries
```
GET /odata/Products?$filter=Price gt 100&$orderby=Name asc&$top=10&$select=Id,Name,Price
```

## Running the Application

1. Ensure you have .NET 8.0 SDK installed
2. Restore NuGet packages: `dotnet restore`
3. Run the application: `dotnet run`
4. Navigate to `https://localhost:7000/swagger` for API documentation
5. Test OData endpoints at `https://localhost:7000/odata/Products`

## Entity Framework Migrations

To create and apply database migrations:

```bash
# Add a new migration
dotnet ef migrations add InitialCreate

# Update the database
dotnet ef database update
```

## Project Structure

```
Api/
├── Controllers/
│   └── ProductsController.cs    # OData CRUD controller
├── Data/
│   └── ApplicationDbContext.cs  # EF Core DbContext
├── Models/
│   └── Product.cs              # Entity model
├── Program.cs                  # Application configuration
├── appsettings.json           # Configuration including connection string
└── Api.csproj                 # Project file with dependencies
```

## Dependencies

- Microsoft.EntityFrameworkCore (8.0.0)
- Microsoft.EntityFrameworkCore.SqlServer (8.0.0)
- Microsoft.EntityFrameworkCore.Tools (8.0.0)
- Microsoft.AspNetCore.OData (8.0.0)
- Microsoft.OData.Edm (8.0.0)
- Swashbuckle.AspNetCore (6.6.2)
