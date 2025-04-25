from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.contrib import messages
from .models import Conversation, Message
from .forms import MessageForm, ConversationForm
from .utils import get_ai_response
import json


def index(request):
    """Home page view"""
    return render(request, 'chat/chat.html')


@login_required
def chat_view(request):
    """Main chat interface"""
    # Get user's conversations
    conversations = Conversation.objects.filter(user=request.user)
    
    # If user has no conversations, create one
    active_conversation = None
    if not conversations.exists():
        active_conversation = Conversation.objects.create(
            user=request.user,
            title="New Conversation"
        )
        # Add welcome message
        Message.objects.create(
            conversation=active_conversation,
            content="Hello, netrunner! How can I assist you in the digital wasteland today?",
            is_user=False
        )
    else:
        # Get the most recent conversation
        active_conversation = conversations.first()
    
    # Get messages for the active conversation
    messages_list = Message.objects.filter(conversation=active_conversation)
    
    # Create form for sending messages
    form = MessageForm()
    
    context = {
        'active_conversation': active_conversation,
        'conversations': conversations,
        'messages': messages_list,
        'form': form,
    }
    
    return render(request, 'chat/chat.html', context)


@login_required
def conversation_detail(request, conversation_id):
    """View for displaying a specific conversation"""
    # Get all user conversations for sidebar
    conversations = Conversation.objects.filter(user=request.user)
    
    # Get the requested conversation if it belongs to the user
    active_conversation = get_object_or_404(Conversation, id=conversation_id, user=request.user)
    
    # Get messages for this conversation
    messages_list = Message.objects.filter(conversation=active_conversation)
    
    # Create form for sending messages
    form = MessageForm()
    
    context = {
        'active_conversation': active_conversation,
        'conversations': conversations,
        'messages': messages_list,
        'form': form,
    }
    
    return render(request, 'chat/chat.html', context)


@login_required
@require_POST
def send_message(request, conversation_id):
    """Handle sending a message and getting AI response"""
    conversation = get_object_or_404(Conversation, id=conversation_id, user=request.user)
    form = MessageForm(request.POST)
    
    if form.is_valid():
        # Save the user message
        user_message = form.save(commit=False)
        user_message.conversation = conversation
        user_message.is_user = True
        user_message.save()
        
        # Get AI response
        ai_response_text = get_ai_response(user_message.content)
        
        # Save the AI response
        ai_message = Message.objects.create(
            conversation=conversation,
            content=ai_response_text,
            is_user=False
        )
        
        # Update conversation's last modified time
        conversation.save()
        
        # For AJAX requests, return JSON response
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({
                'status': 'success',
                'user_message': {
                    'id': user_message.id,
                    'content': user_message.content,
                    'timestamp': user_message.timestamp.strftime('%b %d, %Y, %I:%M %p')
                },
                'ai_message': {
                    'id': ai_message.id,
                    'content': ai_message.content,
                    'timestamp': ai_message.timestamp.strftime('%b %d, %Y, %I:%M %p')
                }
            })
        
        # For non-AJAX requests, redirect back to the conversation
        return redirect('conversation', conversation_id=conversation.id)
    
    # If form is invalid
    messages.error(request, 'Error sending message. Please try again.')
    return redirect('conversation', conversation_id=conversation.id)


@login_required
def new_conversation(request):
    """Create a new conversation"""
    if request.method == 'POST':
        form = ConversationForm(request.POST)
        if form.is_valid():
            conversation = form.save(commit=False)
            conversation.user = request.user
            conversation.save()
            
            # Add welcome message
            Message.objects.create(
                conversation=conversation,
                content="Hello, netrunner! How can I assist you in the digital wasteland today?",
                is_user=False
            )
            
            return redirect('conversation', conversation_id=conversation.id)
    else:
        form = ConversationForm()
    
    return render(request, 'chat/new_conversation.html', {'form': form})


@login_required
@require_POST
def delete_conversation(request, conversation_id):
    """Delete a conversation"""
    conversation = get_object_or_404(Conversation, id=conversation_id, user=request.user)
    conversation.delete()
    
    # If AJAX request
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        return JsonResponse({'status': 'success'})
    
    # Redirect to the first available conversation or create a new one if none exist
    next_conversation = Conversation.objects.filter(user=request.user).first()
    if next_conversation:
        return redirect('conversation', conversation_id=next_conversation.id)
    else:
        return redirect('chat')
