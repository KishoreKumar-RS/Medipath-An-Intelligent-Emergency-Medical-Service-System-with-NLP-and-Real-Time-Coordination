using Backapi.Models;

namespace Backapi.Services
{
    public interface IAuthService
    {
        string HashPassword(string password);
        bool VerifyPassword(string password, string hashed);
        string GenerateJwtToken(Hospital hospital);
    }
}
