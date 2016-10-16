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



