const { v4: uuidv4 } = require('uuid');

const createUser = async (session, username, email, password) => {
    const userId = uuidv4();
    const result = await session.run(
        `CREATE (u:User {
            id: $userId, 
            username: $username, 
            email: $email, 
            password: $password,
            createdAt: timestamp()
        }) RETURN u`,
        { userId, username, email, password }
    );
    return result.records[0].get('u').properties;
};

const findUserByEmail = async (session, email) => {
    const result = await session.run('MATCH (u:User {email: $email}) RETURN u', { email });
    if (result.records.length === 0) {
        return null;
    }
    return result.records[0].get('u').properties;
};

module.exports = {
    createUser,
    findUserByEmail
};