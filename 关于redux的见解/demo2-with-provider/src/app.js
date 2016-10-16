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





