/**
 * Formats a raw role code into a user-friendly display name.
 * @param role The raw role string (e.g., 'DEV', 'ADMIN')
 * @returns The formatted role name
 */
export const formatRole = (role: string): string => {
  if (!role) return '';

  // Normalize: uppercase, trim, and remove 'ROLE_' prefix if present
  const upperRole = role.toUpperCase().trim().replace(/^ROLE_/, '');

  switch (upperRole) {
    case 'DEV':
    case 'DEVELOPER':
      return 'Developer';
    case 'ADMIN':
    case 'ADMINISTRATOR':
      return 'Administrador';
    case 'PO':
    case 'PRODUCT_OWNER':
      return 'Product Owner';
    case 'SM':
    case 'SCRUM_MASTER':
      return 'Scrum Master';
    case 'USER':
      return 'Usuario';
    default:
      // Return the processed role with first letter capitalized
      return upperRole.charAt(0).toUpperCase() + upperRole.slice(1).toLowerCase();
  }
};
