<template>
  <view class="subcategory-container">
    <view class="page-header">
      <view class="header-top">
        <view class="back-button" @tap="navigateBack">
          <text class="iconfont">&#xe679;</text>
        </view>
        <view class="page-title">{{ parentName || '未命名词库' }}</view>
      </view>
    </view>
    
    <!-- 加载状态 -->
    <view v-if="loading" class="loading-section">
      <view class="loader"></view>
      <text>加载中...</text>
    </view>
    
    <!-- 错误信息 -->
    <view v-else-if="errorMessage" class="error-section">
      <text>{{ errorMessage }}</text>
      <view class="retry-btn" @tap="loadSubcategories">重试</view>
    </view>
    
    <!-- 内容列表 -->
    <view v-else>
      <!-- 空状态 -->
      <view v-if="subcategories.length === 0" class="empty-state">
        <image src="/static/empty.png" mode="aspectFit" class="empty-image"></image>
        <text>暂无子词库数据</text>
      </view>
      
      <!-- 内容列表 -->
      <view v-else class="subcategory-list">
        <view 
          class="subcategory-card" 
          v-for="subcategory in displayedSubcategories" 
          :key="subcategory.id"
          @tap="navigateToWordlist(subcategory)"
        >
          <view class="subcategory-info">
            <text class="subcategory-name">{{ subcategory.name || '未命名子词库' }}</text>
            <text class="subcategory-desc">{{ subcategory.description || '暂无描述' }}</text>
          </view>
          <text class="iconfont right-icon">&#xe65e;</text>
        </view>
        
        <!-- 优化后的分页控制 -->
        <view class="pagination" v-if="subcategories.length > 0">
          <view class="page-controls">
            <view class="page-btn first-last-btn" :class="{ disabled: currentPage <= 1 }" @tap="goToFirstPage">
              <text>首页</text>
            </view>
            <view class="page-btn" :class="{ disabled: currentPage <= 1 }" @tap="goToPrevPage">
              <text>上一页</text>
            </view>
            <view class="page-info">
              <text>{{ currentPage }}/{{ totalPages || 1 }}</text>
            </view>
            <view class="page-btn" :class="{ disabled: currentPage >= totalPages }" @tap="goToNextPage">
              <text>下一页</text>
            </view>
            <view class="page-btn first-last-btn" :class="{ disabled: currentPage >= totalPages }" @tap="goToLastPage">
              <text>尾页</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import http from '@/utils/request.js'

export default {
  data() {
    return {
      parentId: '',
      parentName: '',
      loading: true,
      errorMessage: '',
      subcategories: [],
      currentPage: 1,
      pageSize: 8,
      totalItems: 0
    }
  },
  computed: {
    totalPages() {
      return Math.ceil(this.totalItems / this.pageSize);
    },
    displayedSubcategories() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = Math.min(start + this.pageSize, this.subcategories.length);
      return this.subcategories.slice(start, end);
    }
  },
  onLoad(options) {
    console.log('子词库页面接收到的参数:', options);
    
    if (options.parentId) {
      this.parentId = options.parentId;
    }
    
    if (options.parentName) {
      this.parentName = decodeURIComponent(options.parentName);
    } else {
      this.parentName = '未命名词库';
    }
    
    this.checkLogin();
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
      this.loadSubcategories();
    },
    
    // 加载子词库列表
    async loadSubcategories() {
      this.loading = true;
      this.errorMessage = '';
      
      try {
        const token = uni.getStorageSync('token');
        if (!token) {
          throw new Error('未登录');
        }
        
        console.log('开始获取子词库列表, parentId:', this.parentId);
        
        // 使用childSign接口获取所有子词库
        const res = await http.get('/childSign/list', {
          header: {
            'Authorization': token
          }
        });
        
        console.log('子词库API响应:', res);
        
        if (res.data && res.data.code === 0 && res.data.data) {
          console.log('子词库原始数据:', res.data.data);
          
          // 筛选当前parentId的子词库
          if (Array.isArray(res.data.data)) {
            // 确保parentId是数字进行比较
            const parentIdNum = parseInt(this.parentId, 10);
            console.log('转换后的parentId(数字):', parentIdNum);
            
            this.subcategories = res.data.data.filter(item => {
              console.log('比较:', item.parentId, parentIdNum, item.parentId == parentIdNum);
              return item.parentId == parentIdNum;
            });
            
            console.log('筛选后的子词库:', this.subcategories);
            this.totalItems = this.subcategories.length;
            
            // 确保每个子词库都有名称
            this.subcategories = this.subcategories.map(item => {
              if (!item.name || item.name.trim() === '') {
                return {...item, name: '未命名子词库'};
              }
              return item;
            });
          } else {
            console.warn('返回的数据不是数组:', res.data.data);
            this.subcategories = [];
            this.totalItems = 0;
          }
        } else {
          const errorMsg = res.data?.msg || '获取数据失败';
          console.error('API返回错误:', errorMsg, res.data);
          throw new Error(errorMsg);
        }
      } catch (error) {
        console.error('获取子词库列表失败:', error.message || error);
        this.errorMessage = `获取子词库列表失败: ${error.message || '请检查网络后重试'}`;
        
        // 如果服务器没有数据，使用模拟数据
        if (this.subcategories.length === 0) {
          console.log('使用模拟数据');
          this.subcategories = this.getMockSubcategories();
          this.totalItems = this.subcategories.length;
          this.errorMessage = '';  // 清除错误消息
        }
      } finally {
        this.loading = false;
      }
    },
    
    // 跳转到第一页
    goToFirstPage() {
      if (this.currentPage <= 1 || this.loading) return;
      this.currentPage = 1;
    },
    
    // 跳转到上一页
    goToPrevPage() {
      if (this.currentPage <= 1 || this.loading) return;
      this.currentPage--;
    },
    
    // 跳转到下一页
    goToNextPage() {
      if (this.currentPage >= this.totalPages || this.loading) return;
      this.currentPage++;
    },
    
    // 跳转到最后一页
    goToLastPage() {
      if (this.currentPage >= this.totalPages || this.loading) return;
      this.currentPage = this.totalPages;
    },
    
    // 导航到词汇列表页面
    navigateToWordlist(subcategory) {
      const childName = subcategory.name || '未命名子词库';
      uni.navigateTo({
        url: `/pages/vocabulary/wordlist/wordlist?childId=${subcategory.id}&childName=${encodeURIComponent(childName)}&parentId=${this.parentId}&parentName=${encodeURIComponent(this.parentName)}`
      });
    },
    
    // 返回上一页
    navigateBack() {
      uni.navigateBack();
    },
    
    // 开发阶段使用的模拟数据
    getMockSubcategories() {
      return [
        { id: 1, name: '初级词汇', parentId: this.parentId, parentName: this.parentName, description: '适合初学者的基础词汇' },
        { id: 2, name: '中级词汇', parentId: this.parentId, parentName: this.parentName, description: '适合有一定基础的学习者' },
        { id: 3, name: '高级词汇', parentId: this.parentId, parentName: this.parentName, description: '适合进阶学习者的词汇' },
        { id: 4, name: '常用口语', parentId: this.parentId, parentName: this.parentName, description: '日常交流中的常用表达' }
      ];
    }
  }
}
</script>

<style lang="scss">
.subcategory-container {
  min-height: 100vh;
  background-color: #f8f8f8;
  display: flex;
  flex-direction: column;
  padding: 30rpx;
  
  .page-header {
    background: linear-gradient(to right, #3C8999, #55a5b5);
    padding: 30rpx 20rpx;
    color: #fff;
    border-radius: 16rpx;
    margin-bottom: 30rpx;
    box-shadow: 0 6rpx 16rpx rgba(60, 137, 153, 0.2);
    
    .header-top {
      display: flex;
      align-items: center;
      
      .back-button {
        width: 50rpx;
        height: 50rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 30rpx;
        background-color: rgba(255, 255, 255, 0.2);
        border-radius: 25rpx;
      }
      
      .page-title {
        font-size: 34rpx;
        font-weight: bold;
        flex: 1;
        text-align: center;
        margin-right: 50rpx; // 为了平衡左侧返回按钮空间
      }
    }
  }
  
  .loading-section, .error-section {
    height: 300rpx;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-color: #fff;
    border-radius: 16rpx;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
    
    .loader {
      width: 60rpx;
      height: 60rpx;
      border-radius: 50%;
      border: 4rpx solid rgba(60, 137, 153, 0.2);
      border-top-color: #3C8999;
      animation: spin 1s infinite linear;
      margin-bottom: 20rpx;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    text {
      color: #999;
      font-size: 28rpx;
    }
    
    .retry-btn {
      margin-top: 20rpx;
      background-color: #3C8999;
      color: #fff;
      font-size: 26rpx;
      padding: 10rpx 30rpx;
      border-radius: 30rpx;
      box-shadow: 0 4rpx 8rpx rgba(60, 137, 153, 0.2);
    }
  }
  
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80rpx 0;
    background-color: #fff;
    border-radius: 16rpx;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
    
    .empty-image {
      width: 200rpx;
      height: 200rpx;
      margin-bottom: 30rpx;
      opacity: 0.5;
    }
    
    text {
      font-size: 28rpx;
      color: #999;
    }
  }
  
  .subcategory-list {
    background-color: #fff;
    border-radius: 16rpx;
    overflow: hidden;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
    
    .subcategory-card {
      display: flex;
      align-items: center;
      padding: 25rpx;
      border-bottom: 1px solid #f0f0f0;
      transition: all 0.3s;
      
      &:last-child {
        border-bottom: none;
      }
      
      &:active {
        background-color: #f9f9f9;
        transform: scale(0.98);
      }
      
      .subcategory-info {
        flex: 1;
        
        .subcategory-name {
          font-size: 32rpx;
          color: #333;
          font-weight: 500;
          margin-bottom: 8rpx;
          display: block;
        }
        
        .subcategory-desc {
          font-size: 24rpx;
          color: #999;
          display: block;
        }
      }
      
      .right-icon {
        font-size: 36rpx;
        color: #3C8999;
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
}
</style>