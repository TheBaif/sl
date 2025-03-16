<template>
  <view class="page-container">
    <!-- 页面标题 -->
    <view class="page-header">
      <text class="header-title">手语词库</text>
      <text class="header-subtitle">探索丰富的手语词汇世界</text>
    </view>
    
    <!-- 主分类列表 -->
    <view class="category-section" v-if="!loading && parentCategories.length > 0">
      <view class="section-header">
        <text class="section-title">手语分类</text>
        <view class="section-divider"></view>
      </view>
      
      <view class="category-list">
        <view 
          class="category-item" 
          v-for="(item, index) in displayedParentCategories" 
          :key="index"
          @tap="navigateToSubcategory(item)"
        >
          <view class="category-content">
            <text class="category-name">{{ item.name }}</text>
          </view>
          <view class="category-arrow">
            <text>›</text>
          </view>
        </view>
      </view>
      
      <!-- 优化后的分页按钮 -->
      <view class="pagination">
        <view class="page-controls">
          <view class="page-btn first-last-btn" :class="{ disabled: parentCurrentPage <= 1 }" @tap="goToParentFirstPage">
            <text>首页</text>
          </view>
          <view class="page-btn" :class="{ disabled: parentCurrentPage <= 1 }" @tap="goToParentPrevPage">
            <text>上一页</text>
          </view>
          <view class="page-info">
            <text>{{ parentCurrentPage }}/{{ parentTotalPages }}</text>
          </view>
          <view class="page-btn" :class="{ disabled: parentCurrentPage >= parentTotalPages }" @tap="goToParentNextPage">
            <text>下一页</text>
          </view>
          <view class="page-btn first-last-btn" :class="{ disabled: parentCurrentPage >= parentTotalPages }" @tap="goToParentLastPage">
            <text>尾页</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 加载状态 -->
    <view class="loading-container" v-if="loading">
      <view class="loader"></view>
      <text class="loading-text">正在加载...</text>
    </view>
    
    <!-- 空状态 -->
    <view class="empty-container" v-if="!loading && parentCategories.length === 0">
      <image src="/static/empty.png" mode="aspectFit" class="empty-image"></image>
      <text class="empty-text">暂无词库数据</text>
    </view>
  </view>
</template>

<script>
import http from '@/utils/request.js'

export default {
  data() {
    return {
      loading: false,
      parentCategories: [], 
      allChildCategories: [],
      signDataByParentId: {},
      
      // 分页相关
      parentCurrentPage: 1,
      parentPageSize: 8
    }
  },
  onLoad() {
    this.checkLogin();
  },
  computed: {
    // 父分类总页数
    parentTotalPages() {
      return Math.ceil(this.parentCategories.length / this.parentPageSize);
    },
    
    // 当前页显示的父分类
    displayedParentCategories() {
      const start = (this.parentCurrentPage - 1) * this.parentPageSize;
      const end = start + this.parentPageSize;
      return this.parentCategories.slice(start, end);
    }
  },
  methods: {
    // 检查登录状态
    checkLogin() {
      const token = uni.getStorageSync('token');
      console.log('当前token:', token);
      
      if (!token) {
        uni.showToast({
          title: '请先登录',
          icon: 'none'
        });
        
        setTimeout(() => {
          uni.reLaunch({
            url: '/pages/login/login'
          });
        }, 1500);
        
        return;
      }
      
      // 已登录，加载数据
      this.fetchParentCategories();
      this.fetchAllChildCategories();
    },
    
    // 获取主分类列表
    async fetchParentCategories() {
      this.loading = true;
      try {
        const res = await http.get('/parentSign/list');
        
        if (res.statusCode === 200 && res.data.code === 0) {
          // 处理主分类数据，为每个分类添加必要的字段
          this.parentCategories = res.data.data.map(item => {
            return {
              ...item,
              type: 'parent', // 添加类型标识，用于跳转逻辑
              pinyin: '', 
              gesture: '', 
              imageSrc: '', 
              wordVideoSrc: '' 
            }
          });
        } else {
          this.handleRequestError('获取分类列表失败');
        }
      } catch (err) {
        this.handleRequestError('请求失败: ' + (err.message || err));
      } finally {
        this.loading = false;
      }
    },
    
    // 获取所有子分类
    async fetchAllChildCategories() {
      try {
        const res = await http.get('/childSign/list');
        
        if (res.statusCode === 200 && res.data.code === 0) {
          // 处理子分类数据
          this.allChildCategories = res.data.data.map(item => {
            return {
              ...item,
              type: 'child', // 添加类型标识，用于跳转逻辑
              pinyin: '', 
              gesture: '', 
              imageSrc: '', 
              wordVideoSrc: '' 
            }
          });
          
          // 根据parentId对子分类进行分组
          this.groupChildCategoriesByParent();
        } else {
          this.handleRequestError('获取子分类列表失败');
        }
      } catch (err) {
        this.handleRequestError('请求失败: ' + (err.message || err));
      }
    },
    
    // 根据父分类ID分组子分类
    groupChildCategoriesByParent() {
      // 创建一个对象，键为父分类ID，值为该父分类下的所有子分类
      this.signDataByParentId = {};
      
      this.allChildCategories.forEach(item => {
        if (!this.signDataByParentId[item.parentId]) {
          this.signDataByParentId[item.parentId] = [];
        }
        
        // 为子分类添加父分类名称
        const parentCategory = this.parentCategories.find(p => p.id === item.parentId);
        if (parentCategory) {
          item.parentName = parentCategory.name;
        }
        
        this.signDataByParentId[item.parentId].push(item);
      });
    },
    
    // 处理请求错误
    handleRequestError(message, err = null) {
      console.error(message, err);
      this.loading = false;
      uni.showToast({
        title: message,
        icon: 'none'
      });
    },
    
    // 导航到子分类页面
    navigateToSubcategory(item) {
      uni.navigateTo({
        url: `/pages/vocabulary/subcategory/subcategory?parentId=${item.id}&parentName=${encodeURIComponent(item.name)}`
      });
    },
    
    // 父分类分页控制方法
    goToParentFirstPage() {
      if (this.parentCurrentPage <= 1 || this.loading) return;
      this.parentCurrentPage = 1;
    },
    
    goToParentPrevPage() {
      if (this.parentCurrentPage <= 1 || this.loading) return;
      this.parentCurrentPage--;
    },
    
    goToParentNextPage() {
      if (this.parentCurrentPage >= this.parentTotalPages || this.loading) return;
      this.parentCurrentPage++;
    },
    
    goToParentLastPage() {
      if (this.parentCurrentPage >= this.parentTotalPages || this.loading) return;
      this.parentCurrentPage = this.parentTotalPages;
    }
  }
}
</script>

<style lang="scss">
.page-container {
  padding: 30rpx;
  background-color: #f8f8f8;
  min-height: 100vh;
  
  .page-header {
    margin-bottom: 30rpx;
    text-align: center;
    padding: 30rpx 0;
    background: linear-gradient(to right, #3C8999, #55a5b5);
    border-radius: 16rpx;
    box-shadow: 0 6rpx 16rpx rgba(60, 137, 153, 0.2);
    
    .header-title {
      font-size: 40rpx;
      font-weight: bold;
      color: #fff;
      display: block;
      margin-bottom: 12rpx;
    }
    
    .header-subtitle {
      font-size: 26rpx;
      color: rgba(255, 255, 255, 0.8);
    }
  }
  
  .category-section {
    background-color: #fff;
    border-radius: 16rpx;
    padding: 30rpx;
    margin-bottom: 30rpx;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
    
    .section-header {
      margin-bottom: 20rpx;
      position: relative;
      
      .section-title {
        font-size: 34rpx;
        color: #333;
        font-weight: bold;
        display: block;
        position: relative;
        z-index: 1;
      }
      
      .section-divider {
        height: 12rpx;
        width: 100rpx;
        background-color: rgba(60, 137, 153, 0.2);
        position: absolute;
        bottom: 0;
        left: 0;
        z-index: 0;
        border-radius: 6rpx;
      }
    }
    
    .category-list {
      .category-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 25rpx 15rpx;
        border-bottom: 1px solid #f0f0f0;
        transition: all 0.3s;
        
        &:last-child {
          border-bottom: none;
        }
        
        &:active {
          background-color: #f9f9f9;
          transform: scale(0.98);
        }
        
        .category-content {
          flex: 1;
          
          .category-name {
            font-size: 32rpx;
            color: #333;
            display: block;
          }
        }
        
        .category-arrow {
          color: #3C8999;
          font-size: 36rpx;
          font-weight: bold;
          padding: 0 10rpx;
        }
      }
    }
    
    .pagination {
      border-top: 1rpx solid #f5f5f5;
      margin-top: 15rpx;
      padding-top: 20rpx;
      
      .page-controls {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
        gap: 10rpx;
        
        .page-btn {
          height: 56rpx;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #3C8999;
          color: #fff;
          border-radius: 28rpx;
          font-size: 24rpx;
          min-width: 80rpx;
          padding: 0 15rpx;
          box-shadow: 0 2rpx 6rpx rgba(60, 137, 153, 0.2);
          
          &.first-last-btn {
            min-width: 70rpx;
            font-size: 22rpx;
          }
          
          &:active {
            transform: scale(0.95);
          }
          
          &.disabled {
            background-color: #ddd;
            color: #999;
            box-shadow: none;
          }
        }
        
        .page-info {
          margin: 0 10rpx;
          min-width: 70rpx;
          text-align: center;
          
          text {
            font-size: 26rpx;
            color: #666;
          }
        }
      }
    }
  }
  
  .loading-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 400rpx;
    
    .loader {
      width: 60rpx;
      height: 60rpx;
      border-radius: 50%;
      border: 4rpx solid rgba(60, 137, 153, 0.2);
      border-top-color: #3C8999;
      animation: spin 1s infinite linear;
      margin-bottom: 20rpx;
    }
    
    .loading-text {
      font-size: 28rpx;
      color: #999;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  }
  
  .empty-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 400rpx;
    background-color: #fff;
    border-radius: 16rpx;
    padding: 40rpx;
    
    .empty-image {
      width: 200rpx;
      height: 200rpx;
      margin-bottom: 30rpx;
      opacity: 0.5;
    }
    
    .empty-text {
      font-size: 28rpx;
      color: #999;
    }
  }
}
</style>