const express = require('express')
const mongoose = require('mongoose')
const { checkSchema, validationResult} = require('express-validator')
const app = express()
const port = 3399

app.use(express.json())

mongoose.connect('mongodb://127.0.0.1:27017/task-management-app')
.then(() => {
    console.log('Connected to db')
})
.catch((err) => {
    console.log('Connected to error', err)
})

const { Schema, model} = mongoose

const taskSchema = new Schema({
    title: String,
    description: String,
    status: String
}, {timestamps:true})

const Task = model('Task', taskSchema)

const taskValidationSchema = {
    title: {
        in: ['body'],
        exists: {
            errorMessage: 'title is required'
        },
        trim: true,
        notEmpty: {
            errorMessage: 'title cannot be empty'
        },
        isLength: {
            options: { min:5 },
            errorMessage: 'title should be atleast 5 characters long'
        },
        custom: {
            options: function(value){
                return Task.findOne({title: value})
                .then((task) => {
                    if(task){
                        throw new Error('title already exists')
                    }
                    return true
                })
            }
        }
    },
    description: {
        in: ['body'],
        exists: {
            errorMessage: 'description is required'
        },
        trim: true,
        notEmpty: {
            errorMessage: 'description cannot be empty'
        },
        isLength: {
            options: { min:5, max:128},
            errorMessage: 'description should be atleast 6 characters long'
        },
    },
    status: {
        in: ['body'],
        exists: {
            errorMessage: 'status is required'
        },
        trim: true,
        notEmpty: {
            errorMessage: 'status cannot be empty'
        },
        isIn: {
            options: [['pending', 'in progress', 'completed']],
            errorMessage: 'status should be one of (pending, in progress, completed)'
        }
    }
}

app.post('/tasks', checkSchema(taskValidationSchema), (req,res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()})
    }
    const body = req.body
    Task.create(body)
    .then((task) => {
        res.status(201).json(task)
    })
    .catch((err) => {
        res.status(500).json({error: 'Internal server error'})
    })
})


app.get('/tasks', (req,res) => {
    Task.find()
    .then((tasks) => {
        res.json(tasks)
    })
    .catch((err) => {
        res.json(err)
    })
})


const idValidationSchema = {
    id: {
        in: ['params'],
        isMongoId: {
            errorMessage: 'should be a valid mongo Id'
        }
    }
}

app.get('/tasks/:id', checkSchema(idValidationSchema), (req,res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()})
    }
    const id = req.params.id
    Task.findById(id)
    .then((task) => {
        if(!task){
            return res.status(404).json({})
        }
        res.json(task)
    })
    .catch((err) => {
        res.status(500).json({error: 'Internal server error'})
    })
})


const updateTaskValidationSchema = {
    title: {
        in: ['body'],
        exists: {
            errorMessage: 'title is required'
        },
        trim: true,
        notEmpty: {
            errorMessage: 'title cannot be empty'
        },
        isLength: {
            options: { min:5 },
            errorMessage: 'title should be atleast 5 characters long'
        },
    },
    description: {
        in: ['body'],
        exists: {
            errorMessage: 'description is required'
        },
        trim: true,
        notEmpty: {
            errorMessage: 'description cannot be empty'
        },
        isLength:  {
            options: { min:5, max:128},
            errorMessage: 'description should be atleast 6 characters long'
        },
    },
    status: {
        in: ['body'],
        exists: {
            errorMessage: 'status is required'
        },
        trim: true,
        notEmpty: {
            errorMessage: 'status cannot be empty'
        },
        isIn: {
        options: [['pending','in progress', 'completed']],
        errorMessage: 'status should be one of (pending, in progress, completed)'
        }
    }
}


app.put('/tasks/:id', checkSchema(idValidationSchema), checkSchema(updateTaskValidationSchema), (req,res) =>{
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()})
    }
    const id = req.params.id
    const body = req.body
    Task.findByIdAndUpdate(id, body, {new:true})
    .then((task) => {
        if(!task){
            return res.status(404).json({})
        }
        res.json(task)
    })
    .catch((err) => {
        res.status(500).json({error: 'Internal server error'})
    })
})

app.delete('/tasks/:id', checkSchema(idValidationSchema), (req,res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()})
    }
    const id = req.params.id
    Task.findByIdAndDelete(id)
    .then((task) => {
        if(!task){
            return res.status(404).json({})
        }
        res.json(task)
    })
    .catch((err) => {
        res.status(500).json({error: 'Internal server error'})
    })
})


app.listen(port, () => {
    console.log('Server is connected successfully', port)
})