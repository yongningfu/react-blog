## redux内部的触发机制

我们知道redux是通过 Provider 套在根组件的外包
然后里面的受控组件通过 connect函数进行传递dispatch 和 state的
那么这里面究竟发生了什么呢  Provider的作用是啥  connect的作用呢？

### 预先知识点
1. store.getState() 注意这个函数返回的是store里面的state对象的复制对象 注意这个是一个新的复制对象

2.  React本身的组件并不是数据驱动视图的， 它内部维持一个虚拟DOM， 如果对一个组件进行修改的话 先是调用组件的render方法，修改虚拟dom, 但是修改虚拟dom后 不会立即和和真实DOM同步 只有在setState或者forceUpdate方法调用后才进行刷新同步---比如一个组件接收的属性 这个属性值是一个对象 这个对象后面发生改变了 然后它会调用组件的render方法 修改虚拟dom ,但是不会立即更新真实dom 只有调用setState或forceUpdate才更新真实dom

** 例子 **
```html
<!DOCTYPE html>
<html>
  <head>
    <script src="./build/react.js"></script>
    <script src="./build/react-dom.js"></script>
    <script src="./build/browser.min.js"></script>

  </head>
  <body>
    <div id="example"></div>
    <script type="text/babel">

    //这个message对象
    var message = {msg: "initial message"};

    var HelloMessage = React.createClass({

      handlerClick: function() {

        message.msg = "update message";
        //拿掉注释 体验于不加的区别
        this.setState({...this.state});
      },

      render: function() {
        return (<div>

                  { this.props.message.msg } <button onClick={ this.handlerClick }>reverse</button>

                </div>)
      }
    });


    ReactDOM.render(
      <HelloMessage  message={ message }/>,
      document.getElementById('example')
    );

    </script>
  </body>
</html>

```

3. redux中的思想

  既然要说明 redux中的Provider connect是如何实现的话  那我们就先不用Provider 和 connect
  看看如何才能实现  利用redux来管理我们应用的状态

  ** 利用redux的  subscribe dispatch 函数 **

```javascript

import React from 'react'
import { render } from 'react-dom'

import { createStore } from 'redux'

const reducer = (state = {exist: true, title:"example1_title"}, action) => {
    switch (action.type){
        case 'TOGGLE_EXIST': return {...state, exist: !state.exist};
        default: return state;
    }
}

const actions = {
    toggle_exist: () => ({type: 'TOGGLE_EXIST'})
}

const store = createStore(reducer);

//点阅函数
store.subscribe(() =>
    console.log(store.getState())
);

var HelloMessage = React.createClass({

    componentWillMount(){
        //这一步是必须的  前面我们已经说过， 更新组件的真实dom的话 就两个方法 setState和forceUpdate
        //所以 redux必须订阅这个方法  由于使用箭头函数 所以不用担心this问题
        store.subscribe((state)=>this.setState({...this.state}));
    },

    handlerClick: function() {
        store.dispatch(actions.toggle_exist());
    },

    render: function() {
        return (<div>
                    { store.getState().exist ?  <span>{  store.getState().title }</span> : ""}
                    <button onClick={ this.handlerClick }>reverse</button>
                </div>)
    }
});

render(
    <HelloMessage  />,
    document.getElementById('example')
);

```

通过上面的例子 我们就大概的知道了redux的 Provider 和 connect工作过程

4. 还有有个问题就是 如果父组件setState 那么它的子组件会不会重新渲染呢？
答案是肯定的，那么结合redux的思想 我们只要 顶级的组件App上面套一个 Provider, 这个会给顶级根组件 订阅(subscribe)一个setState, 如果有哪个子组件或者
它自己 调用了dispatch的话 会执行这个setState 也就是整个应用进行一次的dom更新(效率也很高 因为更新之前有一次虚拟dom 和 真实dom 的差异匹配工作)

下面就不用Provider 和 connect 创建一个稍微完整的demom

```javascript
import React from 'react'
import { render } from 'react-dom'
import { createStore } from 'redux'

const reducer = (state = {exist: true, title:"A_title", message: "B message"}, action) => {
    switch (action.type){
        case 'TOGGLE_EXIST': return {...state, exist: !state.exist};
        default: return state;
    }
}

const actions = {
    toggle_exist: () => ({type: 'TOGGLE_EXIST'})
}

const store = createStore(reducer);

//点阅函数
store.subscribe(() =>
    console.log(store.getState())
);


var ChildComponentA = React.createClass({

    handlerClick: function() {
        this.props.dispatch(actions.toggle_exist());
    },

    render: function() {
        return (<div>
            { this.props.state.exist ?  <span>{  this.props.state.title }</span> : ""}
            <button onClick={ this.handlerClick }>reverse</button>
        </div>)
    }
});

var ChildComponentB = ({state}) => {

    return (<div>
        { state.message }
    </div>);
}


var App = React.createClass({

    componentWillMount(){
        //顶层父组件祖册这个 setState函数, 所以每次dipatch的时候 其的子组件也会更新
        store.subscribe((state)=>this.setState({...this.state}));
    },

    render: function() {
        return (<div>
                    <label>子组件A的数据:</label>
                    <br/>
                    {/*可以看到 组件的状态是由store统一管理的 每次需要获取状态的时候 就从store里面取出来 所以它本身内部不维持自己的一个状态 注意前面说过getState是复制对象*/}
                    <ChildComponentA state={ store.getState() } dispatch = { store.dispatch }/>
                    <br />
                    <label>子组件B的数据:</label>
                    {/*这个也同理 从store取出状态*/}
                    <ChildComponentB state={ store.getState() } ></ChildComponentB>
                </div>)
    }
});

//App传入的是store
render(
    <App store = { store }/>,
    document.getElementById('example')
);
```

5. 如果一个react根实例已经初始化了以后， 其他后面动态加载进来的组件(通过ReactDOM强制渲染加载进来) 状态如何通过中央数据管理的问题？

** 直接上代码吧 里面有注释 **
```javascript
import React from 'react'
import { render } from 'react-dom'
import { createStore } from 'redux'

const reducer = (state = {exist: true, title:"A_title", message: "B message"}, action) => {
    switch (action.type){
        case 'TOGGLE_EXIST': return {...state, exist: !state.exist};
        default: return state;
    }
}

const actions = {
    toggle_exist: () => ({type: 'TOGGLE_EXIST'})
}

const store = createStore(reducer);

//点阅函数
store.subscribe(() =>
    console.log(store.getState())
);


var ChildComponentA = React.createClass({

    componentWillMount () {
        this.props.store.subscribe( () => { console.log("CCCCCCCCCCCCCCCCCCCCCCCCCCC") });
    },

    handlerClick: function() {
        this.props.dispatch(actions.toggle_exist());
    },

    render: function() {
        return (<div>
            { this.props.state.exist ?  <span>{  this.props.state.title }</span> : ""}
            <button onClick={ this.handlerClick }>reverse</button>
        </div>)
    }
});

var ChildComponentB = ({state}) => {

    return (<div>
        { state.message }
    </div>);
}

//动态组件管理类---这个组件是当根React实例完成后 通过reactDOM强制注入进去的 它的状态数据应该直接由store提供
var ChildComponentC = React.createClass({

    componentWillMount () {
      this.props.store.subscribe( () => {this.forceUpdate() });
    },

    handlerClick: function() {
        this.props.store.dispatch(actions.toggle_exist());
    },

    render: function() {
        return (<div>
            { this.props.store.getState().exist ?  <span>{  this.props.store.getState().title }</span> : ""}
            <button onClick={ this.handlerClick }>reverse</button>
        </div>)
    }
});



var App = React.createClass({

    componentWillMount(){
        //顶层父组件祖册这个 setState函数, 所以每次dipatch的时候 其的子组件也会更新
        store.subscribe((state)=>this.setState({...this.state}));
    },

    componentDidMount () {
        //这个是动态注入的dom
        //注意 这个是用render渲染的 即这个函数只会执行一次 剩下的App就不在对其进行进行属性的数据量传递 所以它的值也应该像App一样，直接由数据中心store来提供
        //render(<ChildComponentA store = {this.props.store} state={ this.props.store.getState() } dispatch = {  this.props.store.dispatch }/>, document.getElementById("dynamicDom"));

        render(<ChildComponentC store = {store} />, document.getElementById("dynamicDom")); //这样就完美解决了
        console.log("aaaaaaaaaaaaaaaa");
    },

    render: function() {
        return (<div>
                    <label>子组件A的数据:</label>
                    <br/>
                    {/*可以看到 组件的状态是由store统一管理的 每次需要获取状态的时候 就从store里面取出来 所以它本身内部不维持自己的一个状态*/}
                    <ChildComponentA store = {this.props.store} state={ this.props.store.getState() } dispatch = {  this.props.store.dispatch }/>
                    <br />
                    <label>子组件B的数据:</label>
                    {/*这个也同理 从store取出状态*/}
                    <ChildComponentB state={  this.props.store.getState() } ></ChildComponentB>
                    <div id="dynamicDom"></div>
                </div>)
    }
});

//App传入的是store----store是变化的  也就说明了这个App的虚拟dom在不断的变化  父组件的属性边 数据往下流  说明了造成了子组件的属性
//跟着父组件的属性的值的变化而变化
render(
    <App store = { store }/>,
    document.getElementById('example')
);

//实现动态Dom注入组件的的管理
```

6. 上面可以看到 我们是利用原生的redux 通过自己订阅监听函数来使根组件App强制重新渲染
   然后它的子组件也跟着重新渲染

   那如何利用  react-redux这个库改进呢？

   我们知道 react-redux 里面有提供Provider 和 connect 首先我们要明白这两个库的作用
   Provider只是提供一个根渲染组件的位置， 也就是它会像App上面那样，自动的在Provider Monut的时候，向store订阅一个渲染函数setState
   这样的话，如果发生了dispatch 就会导致 Provider 和 它下面的子组件重新进行渲染(所以Provider组件需要传递一个store　因为它需要它的subscribe函数)

   那么connect的作用是什么呢？ 它和其实就是给一个组件注入 store 的 state 或者 dispatch 生成一个直接和store有关联的组件--需要在Provider下面才能生成作用

   所以根据我们的需求，如何在应用初始化完成后，某些组件需要动态的用reactDOM 强制渲染的时候，如何管理这些组件的状态？
  - 由于我们之前的应用全部在一个Provider管理下了，现在动态的用reactDOM进行组人一个新组件的话，这个组件是无法再之前应用的Provider管理下更新的
  - 所以我们需要给动态注入的组件也套上一个Provider 让这个Provider去管理这个组件(其实本质就是给在这个组件里面给store添加一个订阅函数 在dispatch的时候 可以自动setState 更新)

  明确了上面的两点  直接上代码吧

```javascript
import React from 'react'
import { render } from 'react-dom'
import { createStore } from 'redux'
import { Provider, connect } from 'react-redux'


const reducer = (state = {exist: true, title:"A_title", message: "B message"}, action) => {
    switch (action.type){
        case 'TOGGLE_EXIST': return {...state, exist: !state.exist};
        default: return state;
    }
}

const actions = {
    toggle_exist: () => ({type: 'TOGGLE_EXIST'})
}

const store = createStore(reducer);

store.subscribe(() =>
    console.log(store.getState())
);


var ChildComponentA = React.createClass({

    // componentWillMount () {
    //     this.props.store.subscribe( () => { console.log("CCCCCCCCCCCCCCCCCCCCCCCCCCC") });
    // },

    handlerClick: function() {
        this.props.dispatch(actions.toggle_exist());
    },

    render: function() {
        return (<div>
            { this.props.state.exist ?  <span>{  this.props.state.title }</span> : ""}
            <button onClick={ this.handlerClick }>reverse</button>
        </div>)
    }
});

var ChildComponentB = ({state}) => {

    return (<div>
        { state.message }
    </div>);
}

var ChildComponentC = React.createClass({

    // componentWillMount () {
    //   this.props.store.subscribe( () => {this.forceUpdate() });
    // },

    handlerClick: function() {
        this.props.dispatch(actions.toggle_exist());
    },

    render: function() {
        return (<div>
            { this.props.state.exist ?  <span>{  this.props.state.title }</span> : ""}
            <button onClick={ this.handlerClick }>reverse</button>
        </div>)
    }
});


const C_ChildComponentC = connect(
    (state, ownProps) => {
        return {
            state: state
        }
    },
    (dispatch, ownProps) => {
        return {
            dispatch: dispatch
        }
    }
)(ChildComponentC);


var App = React.createClass({

    //统一放在Provider下面进行自动管理 不用自己定义这个  即当成Provider的子组件 当Provider更新的时候 Provider的子组件也更新
    // componentWillMount(){
    //     store.subscribe((state)=>this.setState({...this.state}));
    // },

    componentDidMount () {

        render(<Provider store={store}>
                <C_ChildComponentC />
                </Provider>,
            document.getElementById("dynamicDom")); //这样就完美解决了
        // console.log("aaaaaaaaaaaaaaaa");
    },

    render: function() {
        return (<div>
                    <label>子组件A的数据:</label>
                    <br/>
                    <ChildComponentA  state={ this.props.state } dispatch = {  this.props.dispatch }/>
                    <br />
                    <label>子组件B的数据:</label>
                    {/*这个也同理 从store取出状态*/}
                    <ChildComponentB state={  this.props.state } ></ChildComponentB>
                    <div id="dynamicDom"></div>
                </div>)
    }
});

//App的容器组件
const C_App = connect(
    (state, ownProps) => {
        return {
            state: state
        }
    },
    (dispatch, ownProps) => {
        return {
            dispatch: dispatch
        }
    }
)(App);


//Provider只是做一个跟状态管理的作用---系统直接在providr上面订阅setState函数  每当store发生变化的时候 执行provider的setState 那么
//Provider下面的组件也跟着更新
render(
    <Provider store={store}>
        <C_App />
    </Provider>,
    document.getElementById('example')
);
 ```
