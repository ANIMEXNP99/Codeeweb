from django import forms
from .models import Message, Conversation


class MessageForm(forms.ModelForm):
    content = forms.CharField(
        label='',
        widget=forms.Textarea(attrs={
            'class': 'form-control cyber-input',
            'rows': '3',
            'placeholder': 'Type your message here...'
        })
    )

    class Meta:
        model = Message
        fields = ['content']


class ConversationForm(forms.ModelForm):
    title = forms.CharField(
        max_length=100,
        widget=forms.TextInput(attrs={
            'class': 'form-control cyber-input',
            'placeholder': 'Enter conversation title'
        })
    )

    class Meta:
        model = Conversation
        fields = ['title']