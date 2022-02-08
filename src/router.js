//@ts-check
import Router from '@koa/router';
import koaBody from 'koa-body';
import * as indexController from './controller/index.js';
import * as productController from './controller/products.js';
import * as aboutController from './controller/about.js';
import * as contactController from './controller/contact.js';
import * as userController from './controller/users.js';
import * as loginController from './controller/login.js';
import * as legalController from './controller/legal.js';
import * as docuController from './controller/documentation.js'

/** @type {Router<import('./app.js').State, import('./app.js').Context>} */
const router = new Router();

    //INDEX

router.get('/', indexController.showAll);

router.post('/', koaBody({ multipart: true }), loginController.isAuthRole(3), indexController.add);

router.get('/delete/:id', loginController.isAuthRole(3), indexController.confirmDeletion);

router.post('/delete/:id', loginController.isAuthRole(3), indexController.deleteById);



    //PRODUCTS - CATEGORIES

router.get('/products/categories', loginController.isAuthRole(2), productController.editCategories);

router.post('/products/categories', koaBody(), loginController.isAuthRole(2), productController.addCategory);

router.get('/products/categories/delete/:id', loginController.isAuthRole(2), productController.deleteCategory);

    //PRODUCTS

router.get('/products', productController.showAll);

router.get('/products/:id', productController.show);

router.post('/products', koaBody({ multipart: true }), loginController.isAuthRole(2), productController.add);

router.get('/products/edit/:id', loginController.isAuthRole(2), productController.showEdit);

router.get('/products/:id/delete/image/:image', loginController.isAuthRole(2), productController.deleteImage);

router.post('/products/edit/:id', koaBody({ multipart: true }), loginController.isAuthRole(2), productController.edit);

router.get('/products/delete/:id', loginController.isAuthRole(2), productController.confirmDeletion);

router.post('/products/delete/:id', loginController.isAuthRole(2), productController.deleteById);

    //PRODUCT - COMMENTS

router.post('/products/:id', koaBody(), productController.addComment);

router.get('/products/:id/delete/comment/:comment', loginController.isAuthRole(3), productController.deleteComment);



    //ABOUT US

router.get('/about-us', aboutController.renderAbout);




    //CONTACT

router.get('/contact', contactController.renderContact);



    //USERS

router.get('/users', loginController.isAuthRole(1), userController.editUsers);

router.post('/users', koaBody(), loginController.isAuthRole(1), userController.addUser);

router.get('/users/delete/:id', loginController.isAuthRole(1), userController.confirmDeletion);

router.post('/users/delete/:id', loginController.isAuthRole(1), userController.deleteUser);



    //LOGIN

router.get('/login', loginController.showLogin);

router.post('/login', koaBody(), loginController.login);

router.get('/logout', loginController.logout);



    //LEGAL

router.get('/imprint', legalController.renderImprint);

router.get('/privacy', legalController.renderPrivacy);



    //DOCUMENTATION
    
router.get('/documentation/timeline', docuController.renderTimeline);

router.get('/documentation/www', docuController.renderWWW);

router.get('/documentation/frontend', docuController.renderFrontend);

router.get('/documentation/modules', docuController.renderModules);

router.get('/documentation/colours', docuController.renderColours);


export default router;
