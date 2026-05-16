import dotenv from 'dotenv';
dotenv.config();

export function estStaff(membre) {
    if (!membre) return false;
    return membre.roles.cache.has(process.env.MOD_ROLE_ID) || 
           membre.roles.cache.has(process.env.ADMIN_ROLE_ID) || 
           membre.permissions.has('Administrator');
}

export function estAdmin(membre) {
    if (!membre) return false;
    return membre.roles.cache.has(process.env.ADMIN_ROLE_ID) || 
           membre.permissions.has('Administrator');
}

export function peutGererTicket(membre, ticket) {
    if (estAdmin(membre)) return true;
    if (estStaff(membre)) return true;
    return false;
}
