function app(res) {
    let routes = {
        'GET': [],
        'POST': [],
        'PUT': [],
        'PATCH': [],
        'DELETE': [],
    };

    function _get(path, cb) {
        routes['GET'].push({
            'path': path,
            'cb': cb,
        });
    }

    function _post(path, cb) {
        routes['POST'].push({
            'path': path,
            'cb': cb,
        });
    }

    function _put(path, cb) {
        routes['PUT'].push({
            'path': path,
            'cb': cb,
        });
    }

    function _patch(path, cb) {
        routes['PATCH'].push({
            'path': path,
            'cb': cb,
        });
    }

    function _delete(path, cb) {
        routes['DELETE'].push({
            'path': path,
            'cb': cb,
        });
    }

    async function handle(event) {
        let req = {'body': {}};

        // se il method è uno di questi e event.body è dichiarato, allora imposto il body della request
        // NOTA: qui per 'request' intendo la richiesta che passo alla mia callback, NON la chiamata web alla url
        if (event.body && ['POST', 'PUT', 'PATCH'].includes(event.requestContext.http.method)) {
            req.body = JSON.parse(event.body);
        }

        let routeParameters = [req, res];

        // cerco una eventuale rotta che match-i il path che mi arriva dalla chiamata
        let route = routes[event.requestContext.http.method].find((entry) => {
            let parsedPath = parseRoutePath(entry.path, event.requestContext.http.path);
            if (parsedPath !== false) {
                routeParameters.push(...parsedPath);
                return true;
            }

            return entry.path === event.requestContext.http.path;
        });

        if (route && (typeof route.cb === 'function')) {
            await route.cb(...routeParameters);
        } else {
            res.send('Route not found', 404)
        }
    }

    function parseRoutePath(route, path) {
        let routeParameters = [];
        let match = true;

        // esplodo la route impostata dall'app e il path passato dalla chiamata in due array separando le stringhe sui '/'
        const routeParams = route.split('/');
        const pathParams = path.split('/');

        // se i due array hanno lunghezze diverse, posso essere sicuro che la rotta non corrisponda
        if (routeParams.length !== pathParams.length) {
            return false;
        }

        // mi ciclo i due array per controllare che la rotta match-i e imposto le variabili placeholder se presenti
        for (let i = 0; i < routeParams.length; i++) {
            if (routeParams[i] === pathParams[i]) {
                continue;
            } else if (routeParams[i].indexOf('{') !== -1) {
                routeParameters.push(pathParams[i]);
                continue;
            }

            match = false;
            break;
        }

        return match ? routeParameters : false;
    }

    return {
        'get': _get,
        'post': _post,
        'put': _put,
        'patch': _patch,
        'delete': _delete,
        'handle': handle,
    }
}

export {app};