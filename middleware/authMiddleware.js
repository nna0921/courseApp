module.exports = {
    ensureStudent: (req, res, next) => {
        if (!req.session.user || req.session.user.role !== "student") {
            return res.status(403).json({ message: "Access denied. Students only." });
        }
        next();
    },
    ensureAdmin: (req, res, next) => {
        if (!req.session.user || req.session.user.role !== "admin") {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }
        next();
    }
};
