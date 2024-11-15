const setBreadcrumbs = (req, res, next) => {
    const path = req.path.replace(/\/$/, '');
    let breadcrumbs = [{ name: 'Home', link: '/' }];

    // Add User Profile if path starts with /user or /userProfile
    if (path.startsWith('/userProfile') || path.startsWith('/user')) {
        breadcrumbs.push({ name: 'User Profile', link: '/userProfile' });
    }

    const pathSegments = path.split('/').filter(Boolean);
    let currentPath = '';
    let skipNext = path.startsWith('/user') || path.startsWith('/userProfile'); // Skip "user" segment if already handled as User Profile

    for (let i = 0; i < pathSegments.length; i++) {
        const segment = pathSegments[i];
        currentPath += `/${segment}`;
        let name = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');

        // Skip adding "user" again if it has been treated as User Profile
        if (skipNext && segment === 'user') {
            continue;
        }

        if (segment === 'my-order') {
            name = 'My Orders';
            breadcrumbs.push({ name, link: currentPath });
        } else if (segment === 'order-details') {
            name = 'Order Details';
            breadcrumbs.push({ name, link: '#' });
            break;
        } else if (!segment.match(/^[0-9a-fA-F]{24}$/)) {
            breadcrumbs.push({ name, link: currentPath });
        }
    }

    res.locals.breadcrumbs = breadcrumbs;
    next();
};

module.exports = setBreadcrumbs;
