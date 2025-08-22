using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Query;
using Microsoft.AspNetCore.OData.Routing.Controllers;
using Microsoft.EntityFrameworkCore;
using Microsoft.OData.Edm;
using Microsoft.OData.ModelBuilder;
using System.ComponentModel.DataAnnotations;
using System.Reflection;
using Microsoft.Extensions.DependencyInjection;

namespace Api.Controllers
{
    [Route("odata/[Controller]")]
    public abstract class BaseODataController<T, TContext>(TContext context) : ODataController
        where T : class
        where TContext : DbContext
    {
        protected readonly TContext _context = context;
        protected readonly DbSet<T> _dbSet = context.Set<T>();


        // GET: odata/[Entity]
        [EnableQuery]
        [HttpGet]
        public virtual IQueryable<T> Get()
        {
            return _dbSet;
        }

        // GET: odata/[Entity](key)
        [HttpGet("{key}")]
        public virtual async Task<ActionResult<T>> Get(int key)
        {
            var entity = await _dbSet.FindAsync(key);

            if (entity == null)
            {
                return NotFound();
            }

            return entity;
        }

        // POST: odata/[Entity]
        [HttpPost]
        public virtual async Task<ActionResult<T>> Post([FromBody] T entity)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Set audit fields for new entity
            SetAuditFields(entity, isNew: true);

            _dbSet.Add(entity);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(Get), new { key = GetEntityKey(entity) }, entity);
        }

        // PUT: odata/[Entity](key)
        [HttpPut("{key}")]
        public virtual async Task<IActionResult> Put(int key, [FromBody] T entity)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var existingEntity = await _dbSet.FindAsync(key);
            if (existingEntity == null)
            {
                return NotFound();
            }

            // Set audit fields for updated entity
            SetAuditFields(entity, isNew: false);

            _context.Entry(existingEntity).CurrentValues.SetValues(entity);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!EntityExists(key))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return Ok(existingEntity);
        }

        // PATCH: odata/[Entity](key)
        [HttpPatch("{key}")]
        public virtual async Task<IActionResult> Patch(int key, [FromBody] dynamic patchData)
        {
            var entity = await _dbSet.FindAsync(key);
            if (entity == null)
            {
                return NotFound();
            }

            // Apply dynamic patch data to entity
            var entityType = entity.GetType();
            var patchDict = (IDictionary<string, object>)patchData;

            foreach (var kvp in patchDict)
            {
                var property = entityType.GetProperty(kvp.Key);
                if (property != null && property.CanWrite)
                {
                    var value = Convert.ChangeType(kvp.Value, property.PropertyType);
                    property.SetValue(entity, value);
                }
            }

            // Set audit fields for updated entity
            SetAuditFields(entity, isNew: false);

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!EntityExists(key))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return Ok(entity);
        }

        // DELETE: odata/[Entity](key)
        [HttpDelete("{key}")]
        public virtual async Task<IActionResult> Delete(int key)
        {
            var entity = await _dbSet.FindAsync(key);
            if (entity == null)
            {
                return NotFound();
            }

            _dbSet.Remove(entity);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        protected virtual bool EntityExists(int key)
        {
            // This is a basic implementation. You might want to override this in derived controllers
            // to provide more specific entity existence checking
            return _dbSet.Find(key) != null;
        }

        protected virtual int GetEntityKey(T entity)
        {
            // This is a basic implementation. You might want to override this in derived controllers
            // to provide more specific key extraction
            var idProperty = typeof(T).GetProperty("Id");
            return idProperty != null ? (int)(idProperty.GetValue(entity) ?? 0) : 0;
        }

        protected virtual void SetAuditFields(T entity, bool isNew)
        {
            var entityType = entity.GetType();
            var now = DateTime.UtcNow;

            if (isNew)
            {
                // Set CreatedDate for new entities
                var createdDateProperty = entityType.GetProperty("CreatedDate");
                if (createdDateProperty != null && createdDateProperty.CanWrite)
                {
                    createdDateProperty.SetValue(entity, now);
                }
            }

            // Set ModifiedDate for all updates
            var modifiedDateProperty = entityType.GetProperty("ModifiedDate");
            if (modifiedDateProperty != null && modifiedDateProperty.CanWrite)
            {
                modifiedDateProperty.SetValue(entity, now);
            }
        }

    }


}
