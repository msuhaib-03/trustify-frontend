// ========================================================
// MOCK USER SERVICE (localStorage-based)
// ========================================================
// This service simulates user operations with localStorage
// as a mock database. It will be replaced with real Spring Boot
// APIs later.
//
// All function signatures and responses MATCH the real backend
// APIs exactly to ensure seamless transition.
// ========================================================

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// ========================================================
// MOCK USER API IMPLEMENTATIONS
// ========================================================

export const mockUserService = {
  // UPDATE USER PASSWORD
  // REAL API (to be enabled later): PUT /api/user/password
  // axios.put('/api/user/password', { newPassword })
  // MOCK IMPLEMENTATION (temporary - simulates password update)
  updateUserPassword: async (newPassword: string): Promise<boolean> => {
    await delay(800)

    // Mock validation - in real API this would hash and store password
    if (!newPassword || newPassword.length < 8) {
      throw new Error("Password must be at least 8 characters long")
    }

    // Simulate successful password update
    // In real implementation, this would call backend API
    console.log("[Mock User Service] Password update simulated successfully")

    return true
  },
}

export default mockUserService
