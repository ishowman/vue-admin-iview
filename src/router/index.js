import Vue from 'vue';
import iView from 'iview';
import Util from '../libs/util';
import VueRouter from 'vue-router';
import Cookies from 'js-cookie';
import {routers, otherRouter, appRouter} from './router';

Vue.use(VueRouter);

// 路由配置
const RouterConfig = {
    // mode: 'history',
    routes: routers
};

export const router = new VueRouter(RouterConfig);

router.beforeEach((to, from, next) => {
    console.log('currentRoute', router.currentRoute)
    console.log('from', from) // router.currentRoute === from // true
    console.log('to', to)

    iView.LoadingBar.start();
    Util.title(to.meta.title);
    if (Cookies.get('locking') === '1' && to.name !== 'locking') { // 判断当前是否是锁定状态
        next({
            replace: true,
            name: 'locking'
        });
    } else if (Cookies.get('locking') === '0' && to.name === 'locking') {
        next(false);
    } else {
        if (!Cookies.get('user') && to.name !== 'login') {
        // 未登录且前往的页面非登录页，跳转到登录也登录
            next({
                name: 'login'
            });
        } else if (Cookies.get('user') && to.name === 'login') { 
        // 已登录且前往的页面为登录页，跳转到首页
            Util.title();
            next({
                name: 'home_index'
            });
        } else {
            const curRouterObj = Util.getRouterObjByName([otherRouter, ...appRouter], to.name); //获取到当前页面对应的路由对象
            if (curRouterObj && curRouterObj.access !== undefined) { // 需要判断权限的路由
                if (curRouterObj.access === parseInt(Cookies.get('access'))) {
                    Util.toDefaultPage([otherRouter, ...appRouter], to.name, router, next); // 如果在地址栏输入的是一级菜单则默认打开其第一个二级菜单的页面
                    // next() // 要实现上行代码功能，更简单的方法是在子路由中设置{path: '',redirect: '路由path'}更合理。
                        // 优点：杜绝员工无意间修改了默认一级菜单的路由，还少写代码
                        // 风险：Util.openNewPage似乎也和第一个子路由有关，可能会影响; 左侧会生成空的二级菜单

                } else {
                    next({
                        replace: true,
                        name: 'error-403'
                    });
                }
            } else { // 没有配置权限的路由, 直接通过
                Util.toDefaultPage([...routers], to.name, router, next);
                // next()
            }
        }
    }
});

router.afterEach((to) => {
    Util.openNewPage(router.app, to.name, to.params, to.query); // router.app：配置了 router 的 Vue 根实例。
    iView.LoadingBar.finish();
    window.scrollTo(0, 0);
});
