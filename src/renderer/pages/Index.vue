<template>
  <div id="index__wrapper">
    <div id="left">
      <el-menu id="side-nav" default-active="/" :router="true" :collapse="true" active-text-color="#3F51B5">
        <el-menu-item index="/" class="nav__item" title="项目">
          <i class="el-icon-my-projects"></i>
          <span slot="title">项目</span>
        </el-menu-item>
        <el-menu-item index="/schedule" class="nav__item" title="日程">
          <i class="el-icon-my-schedule"></i>
          <span slot="title">日程</span>
        </el-menu-item>
        <el-menu-item index="/users" class="nav__item" title="用户组">
          <i class="el-icon-my-users"></i>
          <span slot="title">用户组</span>
        </el-menu-item>
        <el-menu-item index="/statistics" class="nav__item" title="统计">
          <i class="el-icon-my-statistics"></i>
          <span slot="title">统计</span>
        </el-menu-item>
        <el-menu-item index="/daily" class="nav__item" title="日报">
          <i class="el-icon-my-daily"></i>
          <span slot="title">日报</span>
        </el-menu-item>
        <el-menu-item index="/options" class="nav__item" title="选项设置" v-if="profile.isAdmin">
          <i class="el-icon-my-options"></i>
          <span slot="title">选项设置</span>
        </el-menu-item>
        <el-menu-item index="/evaluation" class="nav__item" title="月度评价" v-if="profile.isAdmin">
          <i class="el-icon-my-evaluation"></i>
          <span slot="title">月度评价</span>
        </el-menu-item>
      </el-menu>
    </div>
    <div id="right">
      <el-popover popper-class="profile" ref="profile" placement="bottom" width="201" trigger="hover">
        <div id="profile__username" class="profile__item">
          <i class="username"></i>
          <span>{{profile.username}}</span>
        </div>
        <div id="profile__city" class="profile__item">
          <i class="city"></i>
          <span>{{profile.cityName}}</span>
        </div>
        <div id="profile__dep" class="profile__item">
          <i class="department"></i>
          <span>{{profile.depName}}</span>
        </div>
        <div id="profile__job" class="profile__item">
          <i class="job"></i>
          <span>{{profile.jobName}}</span>
        </div>
        <div id="profile__btn-group">
          <el-button class="profile__btn" type="text" @click="showEditProfile" v-if="!profile.isAdmin">修改资料</el-button>
          <el-button class="profile__btn" type="text" @click="$router.push('/forgetPwd')" style="float: right">修改密码</el-button>
        </div>
      </el-popover>
      <div id="top-bar">
        <user-avatar id="user__avatar" :username="profile.username" :job="+profile.jobId"></user-avatar>
        <el-button id="user__name" v-popover:profile>{{profile.username}}</el-button>
        <el-button id="refresh" icon="el-icon-refresh" title="刷新页面" @click="refresh"></el-button>
        <el-button id="logout" icon="el-icon-my-logout" title="注销" @click="logout"></el-button>
      </div>
      <transition mode="out-in" name="el-fade-in" :duration="250">
        <router-view id="content__wrapper"></router-view>
      </transition>
      <transition mode="out-in" name="el-fade-in" :duration="250">
        <keep-alive>
          <router-view id="content__wrapper" name="alive"></router-view>
        </keep-alive>
      </transition>
    </div>
    <profile-dialog :isVisible.sync="isVisible" v-if="isVisible" :form="selfProfile" @updateProfile="updateSelfProfile"></profile-dialog>
  </div>
</template>

<script>
import { mapState, mapMutations } from 'vuex';
import { Popover } from 'element-ui';
import Vue from 'vue';
import UserAvatar from '@/components/UserAvatar';
import ProfileDialog from './Index/ProfileDialog';

Vue.use(Popover);

export default {
  components: {
    'profile-dialog': ProfileDialog,
    'user-avatar': UserAvatar,
  },
  data() {
    return {
      isVisible: false,
      selfProfile: {
        username: '',
        city: '',
        dep: '',
        job: '',
      },
    };
  },
  computed: {
    ...mapState(['profile']),
  },
  methods: {
    logout() {
      this.$api.$users.logout();
    },
    refresh() {
      window.location.reload();
    },
    showEditProfile() {
      this.selfProfile = {
        city: this.profile.cityId,
        dep: this.profile.depId,
        job: this.profile.jobId,
        username: this.profile.username,
      };
      this.isVisible = true;
    },
    updateSelfProfile(profileForm) {
      this.$api.$users.updateProfile(profileForm, () => {
        this.$api.$users.getProfile((data) => {
          this.isVisible = false;
          this.updateProfile(data);
        });
      });
    },
    ...mapMutations(['updateProfile']),
  },
  mounted() {
    this.profile.username === '' && this.$api.$users.getProfile(data => this.updateProfile(data));
  },
};
</script>

<style lang="scss" scoped>
#index__wrapper {
  @include fullSize;
  box-sizing: border-box;
}
#left {
  float: left;
  @include setSize(48px, 100%);
}
#right {
  float: right;
  @include setSize(1318px, 100%);
}
#side-nav {
  @include setSize(48px, 100%);
  border: none;
  padding-top: 20px;
  vertical-align: middle;
}
#top-bar {
  @include setSize(100%, 6.25vh);
  @include flex(flex-end);
}
#logout,
#refresh {
  @include setSize(48px, 48px);
  box-sizing: border-box;
  border: none;
  padding: 10px;
  margin-left: 0;
}
#logout,
#refresh,
#user__name {
  box-sizing: border-box;
  border: none;
}
#user__name {
  margin-right: 41px;
  color: $black;
  font-size: 14px;
  line-height: 20px;
  font-weight: bold;
  padding-left: 0;
}

#user__avatar {
  margin-right: 15px;
}

#content__wrapper {
  @include setSize(1318px, 93.75vh);
  display: inline-block;
}

.profile__item {
  @include flex(flex-start);
  @include setSize(100px,32px);
  margin: 0 auto 18px auto;
  i {
    background-size: 28px 28px !important;
  }
  span {
    margin-left: 18px;
    font-weight: bold;
  }
}
#profile__btn-group {
  @include setSize(150px, 32px);
  display: block;
  margin: 13px auto 0 auto;
  padding: 9px 0;
  text-align: center;
  font-size: 14px;
  overflow: hidden;
}
.profile__btn {
  @include setSize(65px, 32px);
  color: $black;
  &:hover {
    color: $default;
  }
}
</style>

<style lang="scss">
.nav__item {
  margin-bottom: 12px;
  padding: 0 !important;
  [class^="el-icon"] {
    font-size: 28px !important;
  }
  i[class^="el-icon-my"] {
    color: #5e5e5e;
  }
  .el-tooltip {
    padding: 0 10px !important;
  }
}

#logout,
#refresh,
#user__name {
  i {
    font-size: 24px;
  }
  &:hover,
  &:focus {
    color: $default;
    background-color: $mask;
  }
}
.profile {
  text-align: center;
  padding: 22px 0;
}
</style>

