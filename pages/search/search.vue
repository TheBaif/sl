<template>
  <view class="search-container">
    <view class="search-header">
      <view class="search-box">
        <input 
          type="text"
          v-model="keyword"
          placeholder="请输入搜索内容"
          @confirm="handleSearch"
          @input="handleInput"
        />
        <text class="search-btn" @tap="handleSearch">搜索</text>
      </view>
    </view>
    
    <view class="search-content">
      <view v-if="loading" class="loading">
        搜索中...
      </view>
      <view v-else>
        <!-- 搜索结果预览 -->
        <view v-if="hasSearched && searchResults.length > 0" class="preview-section">
          <view class="section-header">
            <text class="title">搜索结果</text>
          </view>
          <view class="preview-list">
            <view 
              class="preview-item"
              v-for="(item, index) in searchResults"
              :key="index"
              @tap="goToDetail(index)"
            >
              <text class="name">{{item.name}}</text>
              <text class="pinyin">{{item.pinyin}}</text>
            </view>
          </view>
        </view>

        <!-- 搜索历史 -->
        <view class="history-section" v-if="!hasSearched && searchHistory.length > 0">
          <view class="section-header">
            <text class="title">搜索历史</text>
            <text class="clear-btn" @tap="clearHistory">清空</text>
          </view>
          <view class="history-list">
            <view 
              class="history-item"
              v-for="(item, index) in searchHistory"
              :key="index"
              @tap="searchByHistory(item)"
            >
              {{item}}
            </view>
          </view>
        </view>
        
        <!-- 搜索结果为空的提示 -->
        <view v-if="hasSearched && !searchResults.length" class="empty-result">
          暂无搜索结果
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import http from '@/utils/request.js'
import detailHelper from '@/utils/detailHelper.js'
export default {
  data() {
    return {
      keyword: '',
      loading: false,
      hasSearched: false,
      searchResults: [],
      searchHistory: [],
      searchTimer: null
    }
  },
  
  onLoad() {
    this.checkToken()
    this.loadSearchHistory()
  },
  
  methods: {
    checkToken() {
      const token = uni.getStorageSync('token')
      if (!token) {
        uni.showToast({
          title: '请先登录',
          icon: 'none'
        })
        setTimeout(() => {
          uni.navigateTo({
            url: '/pages/login/login'
          })
        }, 1500)
      }
    },
    
    loadSearchHistory() {
      const history = uni.getStorageSync('searchHistory')
      if (history) {
        this.searchHistory = JSON.parse(history)
      }
    },
    
    saveSearchHistory() {
      if (this.keyword && this.keyword.trim()) {
        let history = this.searchHistory
        history = history.filter(item => item !== this.keyword)
        history.unshift(this.keyword)
        history = history.slice(0, 10)
        this.searchHistory = history
        uni.setStorageSync('searchHistory', JSON.stringify(history))
      }
    },
    
    clearHistory() {
      uni.showModal({
        title: '提示',
        content: '确定要清空搜索历史吗？',
        success: (res) => {
          if (res.confirm) {
            this.searchHistory = []
            uni.removeStorageSync('searchHistory')
            uni.showToast({
              title: '已清空',
              icon: 'success'
            })
          }
        }
      })
    },
    
    searchByHistory(keyword) {
      this.keyword = keyword
      this.handleSearch()
    },
    
    handleInput(e) {
      if(this.searchTimer) {
        clearTimeout(this.searchTimer)
      }
      
      this.searchTimer = setTimeout(() => {
        if(this.keyword.trim()) {
          this.handleSearch()
        } else {
          this.hasSearched = false
          this.searchResults = []
        }
      }, 500)
    },
    
   goToDetail(index) {
     // 格式化数据并存储
     const standardData = detailHelper.prepareDetailData(this.searchResults);
     uni.setStorageSync('searchResults', standardData);
     
     uni.navigateTo({
       url: `/pages/detail/detail?index=${index}`
     });
   },
    
    async handleSearch() {
      if (!this.keyword.trim()) {
        uni.showToast({
          title: '请输入搜索内容',
          icon: 'none'
        })
        return
      }
      
      try {
        this.loading = true
        const res = await http.get('/sign/search', {
          params: {
            keyword: this.keyword
          }
        })
        
        if (res.statusCode === 200 && res.data.code === 0) {
          this.searchResults = res.data.data || []
          this.hasSearched = true
          
          if (this.searchResults.length > 0) {
            this.saveSearchHistory()
          }
        } else {
          throw new Error(res.data.message || '搜索失败')
        }
      } catch (error) {
        console.error('搜索失败:', error)
        uni.showToast({
          title: error.message || '搜索失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style lang="scss">
.search-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  
  .search-header {
    background-color: #fff;
    padding: 20rpx;
    position: sticky;
    top: 0;
    z-index: 100;
    
    .search-box {
      display: flex;
      align-items: center;
      background-color: #f5f5f5;
      border-radius: 35rpx;
      padding: 0 30rpx;
      height: 70rpx;
      
      input {
        flex: 1;
        height: 100%;
        font-size: 28rpx;
      }
      
      .search-btn {
        margin-left: 20rpx;
        color: #007AFF;
        font-size: 28rpx;
      }
    }
  }
  
  .search-content {
    padding: 20rpx;
    
    .preview-section {
      margin-bottom: 30rpx;
      
      .preview-list {
        .preview-item {
          background-color: #fff;
          padding: 20rpx;
          margin-bottom: 20rpx;
          border-radius: 10rpx;
          display: flex;
          flex-direction: column;
          
          .name {
            font-size: 32rpx;
            color: #333;
            margin-bottom: 10rpx;
          }
          
          .pinyin {
            font-size: 28rpx;
            color: #666;
          }
          
          &:active {
            background-color: #f0f0f0;
          }
        }
      }
    }
    
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20rpx;
      
      .title {
        font-size: 32rpx;
        color: #333;
        font-weight: bold;
      }
      
      .clear-btn {
        font-size: 28rpx;
        color: #999;
      }
    }
    
    .history-list {
      display: flex;
      flex-wrap: wrap;
      margin: 0 -10rpx;
      
      .history-item {
        background-color: #fff;
        padding: 10rpx 20rpx;
        border-radius: 25rpx;
        margin: 10rpx;
        font-size: 28rpx;
        color: #666;
        
        &:active {
          background-color: #f0f0f0;
        }
      }
    }
    
    .loading, .empty-result {
      text-align: center;
      color: #999;
      padding: 40rpx 0;
    }
  }
}
</style>
