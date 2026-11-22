const jwt = require('jsonwebtoken');

const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET,
        (err, decoded) => {
            if (err) {
                // טוקן שפג תוקפו או לא תקין - הודעה ברורה למורה במקום "Forbidden" שקט
                return res.status(401).json({
                    message: err.name === 'TokenExpiredError'
                        ? 'פג תוקף ההתחברות. יש לצאת ולהתחבר מחדש.'
                        : 'ההתחברות אינה תקינה. יש לצאת ולהתחבר מחדש.'
                });
            }
            req.user = decoded;
            if (!['teacher', 'admin'].includes(req.user.role)) {
                return res.status(403).json({ message: 'Forbidden' });
            }
            next();
        }
    )
}

module.exports = verifyJWT;