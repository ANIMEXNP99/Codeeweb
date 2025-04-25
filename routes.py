import os
import json
import requests
from datetime import datetime
from flask import render_template, redirect, url_for, flash, request, jsonify, abort
from flask_login import login_user, logout_user, current_user, login_required
from urllib.parse import urlparse  # Use Python's standard library instead of Werkzeug

from app import app, db
from forms import LoginForm, RegistrationForm, MessageForm, NewConversationForm
from models import User, Conversation, Message
from utils import get_ai_response


@app.route('/')
def index():
    if current_user.is_authenticated:
        return redirect(url_for('chat'))
    return render_template('index.html', title='CoderX - Cyberpunk AI Chat Platform')


@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('chat'))
    
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        
        if user is None or not user.check_password(form.password.data):
            flash('Invalid username or password', 'error')
            return redirect(url_for('login'))
        
        login_user(user)
        next_page = request.args.get('next')
        if not next_page or urlparse(next_page).netloc != '':
            next_page = url_for('chat')
        
        flash('Login successful!', 'success')
        return redirect(next_page)
    
    return render_template('login.html', title='Login - CoderX', form=form)


@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('chat'))
    
    form = RegistrationForm()
    if form.validate_on_submit():
        user = User(username=form.username.data, email=form.email.data)
        user.set_password(form.password.data)
        
        db.session.add(user)
        db.session.commit()
        
        # Create first conversation for the user
        conversation = Conversation(title="Welcome to CoderX", user_id=user.id)
        db.session.add(conversation)
        
        # Add welcome message from AI
        welcome_msg = Message(
            content="Welcome to CoderX! I'm your cyberpunk AI assistant. How can I help you today?",
            is_user=False,
            conversation_id=conversation.id
        )
        db.session.add(welcome_msg)
        db.session.commit()
        
        flash('Registration successful! You can now log in.', 'success')
        return redirect(url_for('login'))
    
    return render_template('register.html', title='Register - CoderX', form=form)


@app.route('/logout')
def logout():
    logout_user()
    flash('You have been logged out.', 'info')
    return redirect(url_for('index'))


@app.route('/chat')
@login_required
def chat():
    form = MessageForm()
    conversations = Conversation.query.filter_by(user_id=current_user.id).order_by(Conversation.updated_at.desc()).all()
    
    conversation_id = request.args.get('conversation_id')
    
    if conversation_id:
        conversation = Conversation.query.filter_by(id=conversation_id, user_id=current_user.id).first()
    else:
        # Get the most recent conversation or create one if none exists
        conversation = conversations[0] if conversations else None
        
        if not conversation:
            conversation = Conversation(title="New Conversation", user_id=current_user.id)
            db.session.add(conversation)
            
            # Add welcome message
            welcome_msg = Message(
                content="Welcome to CoderX! I'm your cyberpunk AI assistant. How can I help you today?",
                is_user=False,
                conversation_id=conversation.id
            )
            db.session.add(welcome_msg)
            db.session.commit()
            
            conversations = [conversation]
    
    messages = []
    if conversation:
        messages = Message.query.filter_by(conversation_id=conversation.id).order_by(Message.timestamp).all()
    
    return render_template('chat.html', 
                          title='Chat - CoderX', 
                          form=form, 
                          conversations=conversations, 
                          current_conversation=conversation, 
                          messages=messages)


@app.route('/api/send_message', methods=['POST'])
@login_required
def send_message():
    data = request.get_json()
    
    if not data or 'message' not in data or not data['message'].strip():
        return jsonify({'error': 'No message provided'}), 400
    
    conversation_id = data.get('conversation_id')
    message_content = data['message'].strip()
    
    # Handle creating a new conversation if needed
    if not conversation_id:
        conversation = Conversation(
            title=message_content[:30] + "..." if len(message_content) > 30 else message_content,
            user_id=current_user.id
        )
        db.session.add(conversation)
        db.session.commit()
        conversation_id = conversation.id
    else:
        # Verify the conversation belongs to the current user
        conversation = Conversation.query.filter_by(id=conversation_id, user_id=current_user.id).first()
        if not conversation:
            return jsonify({'error': 'Conversation not found'}), 404
    
    # Save user message
    user_message = Message(
        content=message_content,
        is_user=True,
        conversation_id=conversation_id
    )
    db.session.add(user_message)
    
    # Get AI response
    ai_response = get_ai_response(message_content)
    
    # Save AI response
    ai_message = Message(
        content=ai_response,
        is_user=False,
        conversation_id=conversation_id
    )
    db.session.add(ai_message)
    
    # Update conversation timestamp
    conversation.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({
        'user_message': {
            'id': user_message.id,
            'content': user_message.content,
            'timestamp': user_message.timestamp.strftime('%Y-%m-%d %H:%M:%S')
        },
        'ai_message': {
            'id': ai_message.id,
            'content': ai_message.content,
            'timestamp': ai_message.timestamp.strftime('%Y-%m-%d %H:%M:%S')
        },
        'conversation_id': conversation_id
    })


@app.route('/api/conversations', methods=['GET'])
@login_required
def get_conversations():
    conversations = Conversation.query.filter_by(user_id=current_user.id).order_by(Conversation.updated_at.desc()).all()
    
    return jsonify({
        'conversations': [
            {
                'id': conv.id,
                'title': conv.title,
                'created_at': conv.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                'updated_at': conv.updated_at.strftime('%Y-%m-%d %H:%M:%S')
            } for conv in conversations
        ]
    })


@app.route('/api/conversations/new', methods=['POST'])
@login_required
def new_conversation():
    data = request.get_json()
    title = data.get('title', 'New Conversation')
    
    conversation = Conversation(title=title, user_id=current_user.id)
    db.session.add(conversation)
    
    # Add welcome message
    welcome_msg = Message(
        content="How can I assist you with this new conversation?",
        is_user=False,
        conversation_id=conversation.id
    )
    db.session.add(welcome_msg)
    db.session.commit()
    
    return jsonify({
        'id': conversation.id,
        'title': conversation.title,
        'created_at': conversation.created_at.strftime('%Y-%m-%d %H:%M:%S')
    })


@app.route('/api/conversations/<int:conversation_id>/delete', methods=['DELETE'])
@login_required
def delete_conversation(conversation_id):
    conversation = Conversation.query.filter_by(id=conversation_id, user_id=current_user.id).first()
    
    if not conversation:
        return jsonify({'error': 'Conversation not found'}), 404
    
    db.session.delete(conversation)
    db.session.commit()
    
    return jsonify({'success': True})


@app.route('/api/messages/<int:conversation_id>', methods=['GET'])
@login_required
def get_messages(conversation_id):
    conversation = Conversation.query.filter_by(id=conversation_id, user_id=current_user.id).first()
    
    if not conversation:
        return jsonify({'error': 'Conversation not found'}), 404
    
    messages = Message.query.filter_by(conversation_id=conversation_id).order_by(Message.timestamp).all()
    
    return jsonify({
        'messages': [
            {
                'id': msg.id,
                'content': msg.content,
                'is_user': msg.is_user,
                'timestamp': msg.timestamp.strftime('%Y-%m-%d %H:%M:%S')
            } for msg in messages
        ],
        'conversation': {
            'id': conversation.id,
            'title': conversation.title
        }
    })


@app.route('/profile')
@login_required
def profile():
    conversation_count = Conversation.query.filter_by(user_id=current_user.id).count()
    message_count = Message.query.join(Conversation).filter(Conversation.user_id == current_user.id).count()
    
    return render_template('profile.html', 
                          title='Profile - CoderX',
                          conversation_count=conversation_count,
                          message_count=message_count)


@app.errorhandler(404)
def not_found_error(error):
    return render_template('error.html', error_code=404, error_message="Page not found"), 404


@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return render_template('error.html', error_code=500, error_message="Internal server error"), 500
