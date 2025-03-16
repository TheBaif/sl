<template>
  <view class="page-container">
    <!-- 标题区域 -->
    <view class="page-header">
      <view class="header-top">
        <view class="back-button" @tap="navigateBack">
          <text class="iconfont">&#xe679;</text>
        </view>
        <view class="page-title">{{ childName || parentName || '词汇列表' }}</view>
      </view>
      <view class="header-subtitle" v-if="childName && parentName">{{ parentName }} > {{ childName }}</view>
    </view>
    
    <!-- 加载状态 -->
    <view v-if="loading" class="loading-section">
      <view class="loader"></view>
      <text>加载中...</text>
    </view>
    
    <!-- 错误信息 -->
    <view v-else-if="errorMessage" class="error-section">
      <text>{{ errorMessage }}</text>
      <view class="retry-btn" @tap="loadWordList">重试</view>
    </view>
    
    <!-- 词汇列表 -->
    <view v-else>
      <!-- 列表内容 -->
      <view v-if="wordList.length > 0" class="word-list">
        <view 
          class="word-item" 
          v-for="(item, index) in displayedWords" 
          :key="index"
          @tap="goToDetail(getDisplayedIndex(index))"
        >
          <view class="item-content">
            <text class="item-name">{{item.name}}</text>
            <text class="item-pinyin" v-if="item.pinyin">{{item.pinyin}}</text>
          </view>
          <view class="item-indicator">
            <text class="item-arrow">›</text>
          </view>
        </view>
        
        <!-- 优化后的分页控制 -->
        <view class="pagination">
          <view class="page-controls">
            <view class="page-btn first-last-btn" :class="{ disabled: currentPage <= 1 }" @tap="goToFirstPage">
              <text>首页</text>
            </view>
            <view class="page-btn" :class="{ disabled: currentPage <= 1 }" @tap="goToPrevPage">
              <text>上一页</text>
            </view>
            <view class="page-info">
              <text>{{ currentPage }}/{{ totalPages }}</text>
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
      
      <!-- 空状态 -->
      <view v-else class="empty-state">
        <image src="/static/empty.png" mode="aspectFit" class="empty-image"></image>
        <text>暂无词汇数据</text>
        <view class="refresh-btn" @tap="loadWordList">重新加载</view>
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
      childId: '',
      childName: '',
      loading: true,
      errorMessage: '',
      wordList: [],
      currentPage: 1,
      pageSize: 10
    }
  },
  computed: {
    // 计算总页数
    totalPages() {
      return Math.ceil(this.wordList.length / this.pageSize) || 1;
    },
    
    // 当前页显示的词汇
    displayedWords() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = Math.min(start + this.pageSize, this.wordList.length);
      return this.wordList.slice(start, end);
    }
  },
  onLoad(options) {
    console.log('词汇列表页接收到的参数:', options);
    
    // 获取路由参数
    if (options.parentId) {
      this.parentId = options.parentId;
    }
    
    if (options.parentName) {
      this.parentName = decodeURIComponent(options.parentName || '');
    }
    
    if (options.childId) {
      this.childId = options.childId;
    }
    
    if (options.childName) {
      this.childName = decodeURIComponent(options.childName || '');
    }
    
    // 先检查登录状态，再加载数据
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
      
      // 有token，加载词汇列表
      this.loadWordList();
    },
    
    // 加载词汇列表
    async loadWordList() {
      this.loading = true;
      this.errorMessage = '';
      
      try {
        // 确保token存在
        const token = uni.getStorageSync('token');
        if (!token) {
          throw new Error('未登录');
        }
        
        // 构建请求参数
        const queryParams = {};
        
        // 添加条件参数 - 确保转为整数类型
        if (this.parentId) {
          queryParams.parentId = parseInt(this.parentId, 10);
          console.log('父分类ID:', queryParams.parentId, typeof queryParams.parentId);
        }
        
        if (this.childId) {
          queryParams.childId = parseInt(this.childId, 10);
          console.log('子分类ID:', queryParams.childId, typeof queryParams.childId);
        }
        
        // 设置分页参数
        queryParams.pageNum = 1;
        queryParams.pageSize = 100;
        
        console.log('请求参数:', queryParams);
        
        // 发起请求 - 确保传递token
        const res = await http.get('/sign/list', {
          params: queryParams,
          header: {
            'Authorization': token
          }
        });
        
        console.log('API响应状态:', res.statusCode);
        console.log('API响应数据类型:', typeof res.data);
        
        if (res.statusCode === 200 && res.data && res.data.code === 0) {
          console.log('API响应详情:', res.data);
          
          // 处理数据 - 灵活处理不同结构
          if (res.data.data && res.data.data.records) {
            // 分页结构
            this.wordList = res.data.data.records;
            console.log('找到分页结构数据');
          } else if (res.data.data && Array.isArray(res.data.data)) {
            // 直接数组
            this.wordList = res.data.data;
            console.log('找到数组结构数据');
          } else if (typeof res.data.data === 'object' && res.data.data !== null) {
            // 其他对象结构，尝试提取有用数据
            console.log('未识别的数据结构, 尝试解析:', res.data.data);
            const possibleArrays = Object.values(res.data.data).filter(val => Array.isArray(val));
            if (possibleArrays.length > 0) {
              this.wordList = possibleArrays[0];
              console.log('从对象中提取数组数据');
            } else {
              console.warn('无法提取数组数据');
              this.wordList = [];
            }
          } else {
            console.warn('未找到有效数据结构');
            this.wordList = [];
          }
          
          // 重置分页状态
          this.currentPage = 1;
          
          console.log('处理后的词汇列表:', this.wordList);
          
          // 检查是否找到数据
          if (this.wordList.length === 0) {
            console.log('API返回成功但没有数据, 使用模拟数据');
            this.wordList = this.getMockWords();
          }
        } else {
          console.error('API错误:', res.data ? res.data.message || '获取失败' : '未获取到响应数据');
          throw new Error(res.data ? res.data.message || '获取失败' : '服务器未返回数据');
        }
      } catch (error) {
        console.error('获取词汇列表失败:', error);
        this.errorMessage = `获取词汇列表失败: ${error.message || '请检查网络'}`;
        
        // 使用模拟数据
        console.log('错误后使用模拟数据');
        this.wordList = this.getMockWords();
        this.errorMessage = '';
      } finally {
        this.loading = false;
      }
    },
    
    // 获取原始索引（分页后的索引转为原始数组索引）
    getDisplayedIndex(index) {
      return (this.currentPage - 1) * this.pageSize + index;
    },
    
    // 前往详情页
    goToDetail(index) {
      // 将整个列表存入缓存
      uni.setStorageSync('searchResults', this.wordList);
      // 跳转到详情页
      uni.navigateTo({
        url: `/pages/detail/detail?index=${index}`
      });
    },
    
    // 返回上一页
    navigateBack() {
      uni.navigateBack();
    },
    
    // 分页控制方法
    goToFirstPage() {
      if (this.currentPage <= 1 || this.loading) return;
      this.currentPage = 1;
    },
    
    goToPrevPage() {
      if (this.currentPage <= 1 || this.loading) return;
      this.currentPage--;
    },
    
    goToNextPage() {
      if (this.currentPage >= this.totalPages || this.loading) return;
      this.currentPage++;
    },
    
    goToLastPage() {
      if (this.currentPage >= this.totalPages || this.loading) return;
      this.currentPage = this.totalPages;
    },
    
    // 模拟词汇数据
    getMockWords() {
      return [
        {
          name: '你好', 
          pinyin: 'nǐ hǎo', 
          gesture: '右手五指并拢，手心向内|||置于胸前，轻拍两下|||微笑示意', 
          imageSrc: '/static/images/nihao.jpg', 
          wordVideoSrc: '/static/videos/nihao.mp4'
        },
        {
          name: '再见', 
          pinyin: 'zài jiàn', 
          gesture: '五指并拢，手掌向前|||左右摆动手腕，示意告别', 
          imageSrc: '/static/images/zaijian.jpg', 
          wordVideoSrc: '/static/videos/zaijian.mp4'
        },
        {
          name: '朋友', 
          pinyin: 'péng yǒu', 
          gesture: '两手食指勾在一起|||轻轻摇晃，表示连接', 
          imageSrc: '/static/images/pengyou.jpg', 
          wordVideoSrc: '/static/videos/pengyou.mp4'
        },
        {
          name: '谢谢', 
          pinyin: 'xiè xie', 
          gesture: '右手五指并拢，放于胸前|||向前轻推，表示感谢', 
          imageSrc: '/static/images/xiexie.jpg', 
          wordVideoSrc: '/static/videos/xiexie.mp4'
        },
        {
          name: '对不起', 
          pinyin: 'duì bù qǐ', 
          gesture: '右手握拳放于胸前|||轻轻画圈，表示歉意', 
          imageSrc: '/static/images/duibuqi.jpg', 
          wordVideoSrc: '/static/videos/duibuqi.mp4'
        }
      ];
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
    background: linear-gradient(to right, #3C8999, #55a5b5);
    padding: 30rpx 20rpx;
    color: #fff;
    border-radius: 16rpx;
    margin-bottom: 30rpx;
    box-shadow: 0 6rpx 16rpx rgba(60, 137, 153, 0.2);
    
    .header-top {
      display: flex;
      align-items: center;
      margin-bottom: 10rpx;
      
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
        margin-right: 50rpx; // 平衡左侧返回按钮
      }
    }
    
    .header-subtitle {
      font-size: 24rpx;
      color: rgba(255, 255, 255, 0.8);
      text-align: center;
      margin-top: 10rpx;
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
  
  .word-list {
    background-color: #fff;
    border-radius: 16rpx;
    overflow: hidden;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
    
    .word-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 25rpx;
      position: relative;
      transition: all 0.3s;
      
      &:not(:last-child) {
        border-bottom: 1px solid #f0f0f0;
      }
      
      &:active {
        background-color: #f9f9f9;
        transform: scale(0.98);
      }
      
      .item-content {
        flex: 1;
        
        .item-name {
          font-size: 32rpx;
          color: #333;
          display: block;
          margin-bottom: 8rpx;
          font-weight: 500;
        }
        
        .item-pinyin {
          font-size: 26rpx;
          color: #999;
          display: block;
        }
      }
      
      .item-indicator {
        .item-arrow {
          font-size: 40rpx;
          color: #3C8999;
          font-weight: bold;
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
  
  .empty-state {
    padding: 80rpx 0;
    text-align: center;
    color: #999;
    font-size: 28rpx;
    background-color: #fff;
    border-radius: 16rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
    
    .empty-image {
      width: 200rpx;
      height: 200rpx;
      margin-bottom: 30rpx;
      opacity: 0.5;
    }
    
    .refresh-btn {
      margin-top: 30rpx;
      background-color: #3C8999;
      color: #fff;
      font-size: 28rpx;
      padding: 12rpx 30rpx;
      border-radius: 30rpx;
      box-shadow: 0 4rpx 8rpx rgba(60, 137, 153, 0.2);
    }
  }
}
</style>