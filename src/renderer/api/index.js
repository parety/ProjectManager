import axios from 'axios';
import { Loading, Notification } from 'element-ui';
import router from '../router';
import baseUrl from './config'; // eslint-disable-line
import { backupUrl } from './config'; // eslint-disable-line

const loading = Loading.service;
const notify = Notification;


axios.defaults.baseURL = baseUrl;
axios.defaults.timeout = 5000;
axios.defaults.retry = 4;
axios.defaults.retryDelay = 1000;
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

function errorHandler(err) { }
function get(url, successCb) {
  axios({
    method: 'GET',
    url,
    headers: {
      'Content-type': 'application/x-www-form-urlencoded',
    },
    withCredentials: true,
    crossDomain: true,
  }).then(successCb).catch(errorHandler);
}
function post(url, successCb, data = {}) {
  let params = new URLSearchParams();
  for (let key in data) { // eslint-disable-line
    params.append(key, data[key]);
  }
  axios({
    method: 'POST',
    url,
    data: params,
    headers: {
      'Content-type': 'application/x-www-form-urlencoded',
    },
    withCredentials: true,
    crossDomain: true,
  }).then(successCb).catch(errorHandler);
}
//  带文件上传， Content-Type: multipart/form-data
function post2(url, successCb, data = {}) {
  let form = new FormData();
  for (let key in data) { // eslint-disable-line
    form.append(key, data[key]);
  }
  axios({
    method: 'POST',
    url,
    data: form,
    headers: {
      'Content-type': 'multipart/form-data',
    },
    withCredentials: true,
    crossDomain: true,
  }).then(successCb).catch(errorHandler);
}
function put(url, successCb, data = {}) {
  axios({
    method: 'PUT',
    url,
    data,
    headers: {
      'Content-type': 'application/json',
    },
    withCredentials: true,
    crossDomain: true,
  }).then(successCb).catch(errorHandler);
}
function $delete(url, successCb, data = {}) {
  axios({
    method: 'DELETE',
    url,
    data,
    headers: {
      'Content-type': 'application/json',
    },
    withCredentials: true,
    crossDomain: true,
  }).then(successCb).catch(errorHandler);
}

let loadingInstance;

//#region  请求拦截器，打开loading动画
axios.interceptors.request.use((config) => {
  let text = config.url.indexOf('login') !== -1 ? '登录中 . . .' : '加载中 . . .';
  let loadingConfig = {
    lock: true,
    text,
    spinner: 'coffee-loading',
    background: 'rgba(0, 0, 0, 0.7)',
    customClass: 'coffee-loading__wrapper',
  };
  loadingInstance = loading(loadingConfig);
  return config;
}, error => Promise.reject(error));
//#endregion

//#region  响应拦截器，统一处理错误返回，关闭loading动画
axios.interceptors.response.use((res) => {
  loadingInstance.close();
  res.data.msg && notify({
    title: res.data.msg,
    type: 'success',
  });
  return res.data;
}, (error) => {
  //#region 处理超时，启动备用接口
  if (error.code === 'ECONNABORTED' && error.message.indexOf('timeout') !== -1) {
    let config = error.config;
    // If config does not exist or the retry option is not set, reject
    if (!config || !config.retry) return Promise.reject(error);

    // Set the variable for keeping track of the retry count
    config.__retryCount = config.__retryCount || 0;

    // Check if we've maxed out the total number of retries
    if (config.__retryCount >= config.retry) {
      // Reject with the error
      return Promise.reject(error);
    }

    // Increase the retry count
    config.__retryCount += 1;

    // Create new promise to handle exponential backoff
    let backoff = new Promise(function (resolve) {
      setTimeout(function () {
        resolve();
      }, config.retryDelay || 1);
    });

    // Return the promise in which recalls axios to retry the request
    return backoff.then(function () {
      config.baseURL = backupUrl;
      config.url = config.url.replace(baseUrl, backupUrl);
      return axios(config);
    });
  }
  //#endregion
  let response = error ? error.response : { data: { error: '网络错误' }, status: 0 };
  loadingInstance.close();
  let { data, status } = response;
  notify.error({
    title: data.error || '未知错误',
  });
  switch (status) {
    case 401:
      router.push('/login');
      break;
    default:
  }
  return Promise.reject(`${status}-${data.error}`);
});
//#endregion

//#region 用户接口
const usersApi = {
  options(successCb) {
    get('/users/options', successCb);
  },
  register(data, successCb) {
    post('users/register', successCb, data);
  },
  login(data, successCb) {
    post('users/login', successCb, data);
  },
  autoLogin(successCb) {
    post('users/autologin', successCb);
  },
  logout() {
    post('users/logout', () => {
      router.push('/login');
    });
  },
  updateProfile(data, successCb) {
    put('/users/profile', successCb, data);
  },
  updateProfileByAdmin(uid, data, successCb) {
    put(`/users/profile/${uid}`, successCb, data);
  },
  getProfile(successCb) {
    get('/users/profile', successCb);
  },
  modifyPwd(data, successCb) {
    put('/users/password', successCb, data);
  },
  getUsersList(successCb) {
    get('/users', successCb);
  },
  delete(id, successCb) {
    $delete(`users/${id}`, successCb);
  },
};
//#endregion

//#region 项目接口
const projectsApi = {
  getAllProjects(type, page, successCb) {
    get(`/projects?type=${type}&page=${page}`, successCb);
  },
  getStages(successCb) {
    get('/projects/options', successCb);
  },
  create(data, successCb) {
    post2('/projects', successCb, data);
  },
  getProjectInfo(pid, successCb) {
    get(`/projects/${pid}`, successCb);
  },
  download(url) {
    url && get(url);
  },
  update(pid, data, successCb) {
    post2(`/projects/${pid}`, successCb, data);
  },
  delete(pid, successCb) {
    $delete(`/projects/${pid}`, successCb);
  },
  exchange(pid, data, successCb) {
    put(`/projects/${pid}/leader`, successCb, data);
  },
};
//#endregion

//#region 计划接口
const plansApi = {
  all(pid, successCb) {
    get(`plans?projectId=${pid}`, successCb);
  },
  add(data, successCb) {
    post('plans', successCb, data);
  },
  update(planId, data, successCb) {
    put(`/plans/${planId}`, successCb, data);
  },
  delete(planId, data, successCb) {
    $delete(`/plans/${planId}`, successCb, data);
  },
};
//#endregion

//#region 事件接口
const eventsApi = {
  getTags(successCb) {
    get('/events/tags', successCb);
  },
  create(data, successCb) {
    post('/events', successCb, data);
  },
  update(eventId, data, successCb) {
    put(`events/${eventId}`, successCb, data);
  },
  delete(eventId, data, successCb) {
    $delete(`events/${eventId}`, successCb, data);
  },
  finish(eventId, data, successCb) {
    put(`events/${eventId}/status`, successCb, data);
  },
  get(successCb, date) {
    if (!date) {
      get('/events', successCb);
    } else {
      get(`events?date=${date}`, successCb);
    }
  },
};
//#endregion

//#region 统计接口
const staApi = {
  sysChanges(startTime, endTime, successCb) {
    (startTime && endTime) ?
      get(`/statistics?startTime=${startTime}&endTime=${endTime}`, successCb)
      :
      get('/statistics', successCb);
  },
  excel(type, startTime, endTime, successCb) {
    let callback = (data) => {
      let a = document.createElement('a');
      a.href = data.url;
      a.download = '';
      a.click();
      successCb && successCb();
    };
    (startTime && endTime) ?
      get(`/statistics/excel?type=${type}&startTime=${startTime}&endTime=${endTime}`, callback)
      :
      get(`/statistics/excel?type=${type}`, callback);
  },
  plan(userId, successCb, startTime, endTime) {
    (startTime && endTime) ?
      get(`statistics/${userId}/plan?startTime=${startTime}&endTime=${endTime}`, successCb) :
      get(`statistics/${userId}/plan`, successCb);
  },
  real(userId, successCb, startTime, endTime) {
    (startTime && endTime) ?
      get(`statistics/${userId}/real?startTime=${startTime}&endTime=${endTime}`, successCb) :
      get(`statistics/${userId}/real`, successCb);
  },
  month(date, successCb) {
    let callback = (data) => {
      let a = document.createElement('a');
      a.href = data.url;
      a.download = '';
      a.click();
      successCb && successCb();
    };
    get(`/statistics/excel/monthreport/url?date=${date}`, callback);
  },
};
//#endregion

//#region 日程接口
const scheduleApi = {
  getSchedules(successCb, year = new Date().getFullYear(), month = new Date().getMonth() + 1) {
    get(`/schedules/${year}/${month}`, successCb);
  },
  updateWorkHour(successCb, data) {
    post('/schedules/workhour', successCb, data);
  },
  updateWorkHourByPM(successCb, data) {
    put('/schedules/workhour', successCb, data);
  },
  updateWorkHourAll(successCb, data) {
    put('/schedules/workhour/all', successCb, data);
  },
  getWorkHour(successCb, startTime, endTime) {
    get(`/schedules/workhour?startTime=${startTime}&endTime=${endTime}`, successCb);
  },
};
//#endregion

//#region 菜单管理
const optionsApi = {
  add(type, data, successCb) {
    post(`/options/${type}`, successCb, data);
  },
  update(type, id, data, successCb) {
    put(`/options/${type}/${id}`, successCb, data);
  },
  delete(type, id, successCb) {
    $delete(`/options/${type}/${id}`, successCb);
  },
};
//#endregion

//#region 日报接口
const dailyApi = {
  add(data, successCb) {
    post('/dailies', successCb, data);
  },
  abstract(userId, date, successCb) {
    get(`/dailies?uid=${userId}&date=${date}`, successCb);
  },
  detail(dailyId, date, successCb) {
    get(`/dailies/${dailyId}?date=${date}`, successCb);
  },
  update(data, successCb) {
    put('/dailies', successCb, data);
  },
  delete(dailyId, dailyDate, successCb) {
    $delete(`/dailies/${dailyId}`, successCb, {
      date: dailyDate,
    });
  },
};
//#endregion

//#region 评价接口
const evaluation = {
  getProjcets(date, successCb) {
    get(`/evaluation/projects?date=${date}`, successCb);
  },
  add(data, successCb) {
    post('/evaluation', successCb, data);
  },
  update(data, successCb) {
    put('/evaluation', successCb, data);
  },
  delete(data, successCb) {
    $delete('/evaluation', successCb, data);
  },
  getAll(year, successCb) {
    get(`/evaluation/${year}`, successCb);
  },
  table(month, successCb) {
    get(`/evaluation/table/${month}`, successCb);
  },
};

export default {
  $users: usersApi,
  $projects: projectsApi,
  $plans: plansApi,
  $events: eventsApi,
  $sta: staApi,
  $sche: scheduleApi,
  $options: optionsApi,
  $daily: dailyApi,
  $evaluation: evaluation,
};

export {
  baseUrl,
};
